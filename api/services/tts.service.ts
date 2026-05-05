import { InternalServerError } from "@api/errors/app.error";
import { z } from "zod";
import { BaseService } from "./base.service";
import type { BucketService } from "./bucket.service";

// ─── Part 1: Google Service Account Credentials Parser ───────────────────────

const GoogleTtsCredentialsSchema = z.object({
    type: z.literal("service_account"),
    project_id: z.string().min(1),
    private_key_id: z.string().min(1),
    private_key: z
        .string()
        .min(1)
        .transform((key) => key.replace(/\\n/g, "\n")),
    client_email: z.string().email(),
    token_uri: z.string().url().default("https://oauth2.googleapis.com/token"),
});

export type GoogleTtsCredentials = z.infer<typeof GoogleTtsCredentialsSchema>;

export function parseGoogleTtsCredentials(raw: string): GoogleTtsCredentials {
    let parsed: unknown;
    try {
        // Wrangler local .dev.vars can inject real newlines into JSON string values.
        // Re-escape line breaks so JSON.parse can safely parse credential payloads.
        const sanitized = raw.replace(/\r?\n/g, "\\n");
        parsed = JSON.parse(sanitized);
    } catch {
        throw new InternalServerError(
            "GOOGLE_TTS_CREDENTIALS is not valid JSON — check the Cloudflare secret value"
        );
    }

    const result = GoogleTtsCredentialsSchema.safeParse(parsed);
    if (!result.success) {
        const issues = result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ");
        throw new InternalServerError(`GOOGLE_TTS_CREDENTIALS schema invalid: ${issues}`);
    }

    return result.data;
}

// ─── Part 2: TTS Service ─────────────────────────────────────────────────────

const TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

export type TtsAudioResult = {
    enAudioUrl: string;
    zhAudioUrl: string;
};

type SynthesiseInput = {
    text: string;
    languageCode: string;
    voiceName: string;
};

export class TtsService extends BaseService {
    constructor(
        private readonly credentials: GoogleTtsCredentials,
        private readonly bucketService: BucketService
    ) {
        super();
    }

    async generateAndUpload(
        vocabularyId: string,
        enText: string,
        zhText: string
    ): Promise<TtsAudioResult> {
        const accessToken = await this.getAccessToken();

        const [enAudio, zhAudio] = await Promise.all([
            this.synthesise(accessToken, {
                text: enText,
                languageCode: "en-US",
                voiceName: "en-US-Neural2-F",
            }),
            this.synthesise(accessToken, {
                text: zhText,
                languageCode: "cmn-CN",
                voiceName: "cmn-CN-Wavenet-A",
            }),
        ]);

        const folder = `vocabulary/audio/${vocabularyId}`;

        const [enUpload, zhUpload] = await Promise.all([
            this.bucketService.upload(enAudio, {
                folder,
                fileName: "en.mp3",
                contentType: "audio/mpeg",
            }),
            this.bucketService.upload(zhAudio, {
                folder,
                fileName: "zh.mp3",
                contentType: "audio/mpeg",
            }),
        ]);

        return {
            enAudioUrl: enUpload.secure_url,
            zhAudioUrl: zhUpload.secure_url,
        };
    }

    private async synthesise(token: string, input: SynthesiseInput): Promise<ArrayBuffer> {
        const body = JSON.stringify({
            input: { text: input.text },
            voice: { languageCode: input.languageCode, name: input.voiceName },
            audioConfig: { audioEncoding: "MP3" },
        });

        const response = await fetch(TTS_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body,
        });

        if (!response.ok) {
            const detail = await response.text().catch(() => "unknown");
            throw new InternalServerError(
                `Google TTS synthesis failed (${response.status}): ${detail}`
            );
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
            const detail = await response.text().catch(() => "unknown");
            throw new InternalServerError(
                `Google TTS returned unexpected content type (${contentType || "unknown"}): ${detail}`
            );
        }

        const json = (await response.json()) as { audioContent?: string };

        if (typeof json.audioContent !== "string" || json.audioContent.length === 0) {
            throw new InternalServerError("Google TTS returned empty audioContent");
        }

        return base64ToArrayBuffer(json.audioContent);
    }

    private async getAccessToken(): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const scope = "https://www.googleapis.com/auth/cloud-platform";
        // TODO: Cache token until expiry (exp - 60s) if this service becomes long-lived.

        const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const claim = base64UrlEncode(
            JSON.stringify({
                iss: this.credentials.client_email,
                scope,
                aud: this.credentials.token_uri,
                iat: now,
                exp: now + 3600,
            })
        );

        const signingInput = `${header}.${claim}`;
        const privateKey = await importRsaPrivateKey(this.credentials.private_key);
        const signature = await crypto.subtle.sign(
            { name: "RSASSA-PKCS1-v1_5" },
            privateKey,
            new TextEncoder().encode(signingInput)
        );
        const jwt = `${signingInput}.${base64UrlEncode(arrayBufferToBase64(signature))}`;

        const tokenResponse = await fetch(this.credentials.token_uri, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt,
            }),
        });

        if (!tokenResponse.ok) {
            const detail = await tokenResponse.text().catch(() => "unknown");
            throw new InternalServerError(`Google OAuth token exchange failed: ${detail}`);
        }

        const tokenJson = (await tokenResponse.json()) as { access_token?: string };
        if (typeof tokenJson.access_token !== "string") {
            throw new InternalServerError("Google OAuth response missing access_token");
        }

        return tokenJson.access_token;
    }
}

// ─── Crypto Helpers ───────────────────────────────────────────────────────────

async function importRsaPrivateKey(pem: string): Promise<CryptoKey> {
    const pemBody = pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, "")
        .replace(/-----END PRIVATE KEY-----/g, "")
        .replace(/\\n/g, "")
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .replace(/\s/g, "");

    const der = base64ToArrayBuffer(pemBody);

    return crypto.subtle.importKey(
        "pkcs8",
        der,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );
}

function base64UrlEncode(input: string | ArrayBuffer): string {
    const bytes =
        typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
    const base64 = uint8ArrayToBase64(bytes);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return uint8ArrayToBase64(new Uint8Array(buffer));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j]);
        }
    }
    return btoa(binary);
}
