import { BadRequestError } from "@api/errors/app.error";
import { createAiService } from "@api/factories/ai.factory";
import { getTtsService } from "@api/factories/service.factory";
import type { AppOpenApi } from "@api/helpers/types.helpers";
import { createRouter } from "@api/lib/app.lib";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireSuperAdmin } from "@api/middleware/require-super-admin.middleware";
import {
    VOCABULARY_TRANSLATION_INSTRUCTIONS,
    VOCABULARY_TRANSLATION_SCHEMA,
    type VocabularyTranslation,
} from "@api/services/vocabulary/vocabulary-processing.service";
import { pinyin } from "pinyin-pro";

const DEFAULT_SYSTEM_PROMPT = [
    "You are a vocabulary enrichment API.",
    "Respond with raw JSON only. NO markdown, NO code fences, NO explanation. Just the JSON object.",
    "All fields must be non-empty strings, except needs_language_review which is boolean.",
].join("\n");

type VocabAiTestRequest = {
    phrase?: unknown;
    systemPrompt?: unknown;
    temperature?: unknown;
    maxTokens?: unknown;
};

type VocabAiAudioTestRequest = {
    enText?: unknown;
    zhText?: unknown;
};

type ParsedTranslation = VocabularyTranslation & { pinyin: string };

type ParseFailure = {
    error: string;
    raw: string;
    parsedJson: unknown | null;
};

const _vocabAiTestRouter = createRouter()
    .post("/vocab-ai-test", requireAuth, requireSuperAdmin, async (c) => {
        const payload = (await c.req.json()) as VocabAiTestRequest;
        const phrase = String(payload.phrase ?? "").trim();
        if (!phrase) throw new BadRequestError("`phrase` is required");

        const systemPrompt = parseSystemPrompt(payload.systemPrompt);
        const temperature = parseTemperature(payload.temperature);
        const maxTokens = parseMaxTokens(payload.maxTokens);

        const ai = createAiService(c, {
            systemPrompt,
            defaults: {
                temperature,
                maxTokens,
                responseFormat: {
                    type: "json_schema",
                    json_schema: VOCABULARY_TRANSLATION_SCHEMA,
                },
            },
        });

        const prompt = `${VOCABULARY_TRANSLATION_INSTRUCTIONS}\nEnglish phrase: "${phrase}"`;

        const result = await ai.generate(prompt);
        const parsed = parseTranslationResponse(result.text, phrase);

        if ("error" in parsed) {
            return c.json(
                {
                    data: {
                        error: parsed.error,
                        model: ai.getModel(),
                        prompt,
                        raw: parsed.raw,
                        parsedJson: parsed.parsedJson,
                        generatedAt: result.generatedAt,
                    },
                },
                422
            );
        }

        return c.json({
            data: {
                model: ai.getModel(),
                prompt,
                result: parsed,
                raw: result.text,
                generatedAt: result.generatedAt,
            },
        });
    })
    .post("/vocab-ai-test/openwebui-models", requireAuth, requireSuperAdmin, async (c) => {
        const ai = createAiService(c, {});
        const models = await ai.fetchModels();
        return c.json({ data: { models } });
    })
    .post("/vocab-ai-test/audio", requireAuth, requireSuperAdmin, async (c) => {
        const payload = (await c.req.json()) as VocabAiAudioTestRequest;
        const enText = String(payload.enText ?? "").trim();
        const zhText = String(payload.zhText ?? "").trim();

        if (!enText) throw new BadRequestError("`enText` is required");
        if (!zhText) throw new BadRequestError("`zhText` is required");

        const testId = await buildAudioTestId(enText);
        const ttsService = getTtsService(c);
        const { enAudioUrl, zhAudioUrl } = await ttsService.generateAndUpload(
            testId,
            enText,
            zhText
        );

        return c.json({
            data: {
                testId,
                enText,
                zhText,
                enAudioUrl,
                zhAudioUrl,
            },
        });
    });

/** Cast: plain `.post()` narrows to `Hono`; `mountRoutes` expects `OpenAPIHono` (TEMP route). */
export const vocabAiTestRoutes = _vocabAiTestRouter as AppOpenApi;

// ---------------------------------------------------------------------------
// Request param parsers — client-supplied tuning values only
// ---------------------------------------------------------------------------

function parseSystemPrompt(systemPrompt: unknown): string {
    if (typeof systemPrompt !== "string") return DEFAULT_SYSTEM_PROMPT;
    const trimmed = systemPrompt.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_SYSTEM_PROMPT;
}

function parseTemperature(temperature: unknown): number {
    if (typeof temperature === "number") return temperature;
    if (typeof temperature === "string" && temperature.trim() !== "") {
        const parsed = Number.parseFloat(temperature);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return 0.1;
}

function parseMaxTokens(maxTokens: unknown): number {
    if (typeof maxTokens === "number") return Math.max(1, Math.floor(maxTokens));
    if (typeof maxTokens === "string" && maxTokens.trim() !== "") {
        const parsed = Number.parseInt(maxTokens, 10);
        if (!Number.isNaN(parsed)) return Math.max(1, parsed);
    }
    return 512;
}

// ---------------------------------------------------------------------------
// Translation response parsing
// ---------------------------------------------------------------------------

function parseTranslationResponse(
    raw: string,
    fallbackText?: string
): ParsedTranslation | ParseFailure {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (error: unknown) {
        return {
            error: `AI output is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
            raw,
            parsedJson: null,
        };
    }

    const candidate = unwrapCandidateObject(parsed);
    if (!candidate) return { error: "AI output JSON is not an object", raw, parsedJson: parsed };

    const norm = candidate.normalized_text || fallbackText;
    const zh = candidate.zh_translation;
    const review = candidate.needs_language_review;
    const ipaUs = candidate.ipa_us;
    const syllablesEn = candidate.syllables_en;
    const syllablesIpa = candidate.syllables_ipa;
    const definitionSimple = candidate.definition_simple;

    const fieldErrors: string[] = [];

    if (typeof norm !== "string") fieldErrors.push("`normalized_text` must be a string");
    else if ((norm as string).trim().length === 0)
        fieldErrors.push("`normalized_text` must be non-empty");

    if (typeof zh !== "string") fieldErrors.push("`zh_translation` must be a string");
    else if (zh.trim().length === 0) fieldErrors.push("`zh_translation` must be non-empty");

    if (typeof review !== "boolean") fieldErrors.push("`needs_language_review` must be a boolean");

    if (typeof ipaUs !== "string") fieldErrors.push("ipa_us must be a string");
    else if (ipaUs.trim().length === 0) fieldErrors.push("ipa_us must be non-empty");

    if (typeof syllablesEn !== "string") fieldErrors.push("syllables_en must be a string");
    else if (syllablesEn.trim().length === 0) fieldErrors.push("syllables_en must be non-empty");

    if (typeof syllablesIpa !== "string") fieldErrors.push("syllables_ipa must be a string");
    else if (syllablesIpa.trim().length === 0) fieldErrors.push("syllables_ipa must be non-empty");

    if (typeof definitionSimple !== "string")
        fieldErrors.push("definition_simple must be a string");
    else if (definitionSimple.trim().length === 0)
        fieldErrors.push("definition_simple must be non-empty");

    if (fieldErrors.length > 0) {
        return {
            error: `AI output is not valid translation JSON: ${fieldErrors.join("; ")}`,
            raw,
            parsedJson: parsed,
        };
    }

    return {
        normalized_text: norm as string,
        zh_translation: zh as string,
        pinyin: pinyin(zh as string, { toneType: "symbol", separator: " " }),
        needs_language_review: review as boolean,
        ipa_us: ipaUs as string,
        syllables_en: syllablesEn as string,
        syllables_ipa: syllablesIpa as string,
        definition_simple: definitionSimple as string,
    };
}

function unwrapCandidateObject(input: unknown): Record<string, unknown> | null {
    if (typeof input !== "object" || input === null) return null;
    const obj = input as Record<string, unknown>;
    if (isTranslationShape(obj)) return obj;

    for (const key of ["response", "result", "data"] as const) {
        const nested = obj[key];
        if (typeof nested === "object" && nested !== null) {
            const nestedObj = nested as Record<string, unknown>;
            if (isTranslationShape(nestedObj)) return nestedObj;
        }
        if (typeof nested === "string" && nested.trim().startsWith("{")) {
            try {
                const reparsed = JSON.parse(nested) as unknown;
                if (typeof reparsed === "object" && reparsed !== null) {
                    const reparsedObj = reparsed as Record<string, unknown>;
                    if (isTranslationShape(reparsedObj)) return reparsedObj;
                }
            } catch {
                // no-op
            }
        }
    }
    return obj;
}

function isTranslationShape(value: Record<string, unknown>): boolean {
    return (
        "normalized_text" in value &&
        "zh_translation" in value &&
        "needs_language_review" in value &&
        "ipa_us" in value &&
        "syllables_en" in value &&
        "syllables_ipa" in value &&
        "definition_simple" in value
    );
}

async function buildAudioTestId(text: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const bytes = new Uint8Array(digest);
    let hex = "";
    for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, "0");
    }
    return `test-${hex.slice(0, 16)}`;
}
