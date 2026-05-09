import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { buildMessages, resolveAiRunParams } from "@api/helpers/ai.helpers";
import type {
    AiGenerateDefaultsResolved,
    AiGenerateOptions,
    AiGenerateResult,
    AiJsonSchema,
    AiMessage,
    AiServiceConfig,
    AiTextModel,
} from "@api/types/ai.types";
import { BaseService } from "./base.service";

/**
 * Google Gemini (`generativelanguage.googleapis.com`) REST client with a typed chat-style API.
 */
export class AiService extends BaseService {
    private readonly apiKey: string;
    private readonly model: AiTextModel;
    private readonly systemPrompt: string | undefined;
    private readonly defaults: AiGenerateDefaultsResolved;

    constructor(config: AiServiceConfig) {
        super();

        if (!config.apiKey?.trim()) {
            throw new InternalServerError("GEMINI_API_KEY is not configured.");
        }
        if (!config.defaultModel?.trim()) {
            throw new InternalServerError("GEMINI_MODEL is not configured.");
        }

        this.apiKey = config.apiKey;
        this.model = config.defaultModel.trim();
        this.systemPrompt = config.systemPrompt;
        this.defaults = {
            maxTokens: config.defaults?.maxTokens ?? 256,
            temperature: config.defaults?.temperature ?? 0.7,
            topP: config.defaults?.topP ?? 1,
            responseFormat: config.defaults?.responseFormat,
        };
    }

    async generate(prompt: string, options: AiGenerateOptions = {}): Promise<AiGenerateResult> {
        const messages = buildMessages([{ role: "user", content: prompt }], this.systemPrompt);
        return this.runChat(messages, options);
    }

    async chat(messages: AiMessage[], options: AiGenerateOptions = {}): Promise<AiGenerateResult> {
        const full = buildMessages(messages, this.systemPrompt);
        return this.runChat(full, options);
    }

    getModel(): AiTextModel {
        return this.model;
    }

    async fetchModels(): Promise<string[]> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;

        const res = await fetch(url, {
            method: "GET",
        });

        const payload = (await res.json().catch(() => null)) as {
            models?: Array<{
                name?: string;
                supportedGenerationMethods?: string[];
            }>;
            error?: { message?: string };
        } | null;

        if (!res.ok) {
            const detail =
                payload?.error?.message ??
                (payload !== null ? JSON.stringify(payload) : "empty response");
            throw new InternalServerError(`Gemini list models HTTP ${res.status}: ${detail}`);
        }

        const models = payload?.models;
        if (!Array.isArray(models)) {
            throw new ServiceUnavailableError("Gemini returned no models list.");
        }

        const ids: string[] = [];
        for (const m of models) {
            const name = m.name;
            if (typeof name !== "string" || !name.includes("/")) continue;
            const supports = m.supportedGenerationMethods;
            if (Array.isArray(supports) && !supports.some((x) => x === "generateContent")) {
                continue;
            }
            const id = name.split("/").pop();
            if (id && id.length > 0) ids.push(id);
        }

        if (ids.length === 0) {
            throw new ServiceUnavailableError(
                "Gemini reported no generateContent-compatible models."
            );
        }

        return ids;
    }

    stream(_prompt: string, _options?: AiGenerateOptions): Promise<ReadableStream> {
        return Promise.reject(
            new ServiceUnavailableError("Streaming is not enabled for Gemini integration.")
        );
    }

    private async runChat(
        messages: AiMessage[],
        options: AiGenerateOptions
    ): Promise<AiGenerateResult> {
        const systemMsg = messages.find((m) => m.role === "system");
        const dialogue = messages.filter((m) => m.role !== "system");

        const params = resolveAiRunParams(options, this.defaults);

        const generationConfig: Record<string, unknown> = {
            temperature: params.temperature,
            maxOutputTokens: params.max_tokens,
            topP: params.top_p,
        };

        if (params.response_format?.type === "json_schema") {
            generationConfig.responseMimeType = "application/json";
            generationConfig.responseSchema = geminiResponseSchemaObject(
                params.response_format.json_schema
            );
        } else if (params.response_format?.type === "json_object") {
            generationConfig.responseMimeType = "application/json";
        }

        const body: Record<string, unknown> = {
            contents: dialogue.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            })),
            generationConfig,
        };

        if (systemMsg) {
            body.systemInstruction = { parts: [{ text: systemMsg.content }] };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const payload = await res.json().catch(() => null);
            if (!res.ok) {
                throw new InternalServerError(
                    `Gemini returned HTTP ${res.status}: ${JSON.stringify(payload)}`
                );
            }

            const text = extractGeminiText(payload);

            if (
                !text &&
                params.response_format &&
                typeof payload === "object" &&
                payload !== null
            ) {
                return {
                    text: JSON.stringify(payload),
                    generatedAt: new Date().toISOString(),
                };
            }

            if (!text) {
                throw new ServiceUnavailableError(
                    `Gemini returned no text for model "${this.model}".`
                );
            }

            return { text, generatedAt: new Date().toISOString() };
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            if (error instanceof InternalServerError || error instanceof ServiceUnavailableError)
                throw error;
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes("abort")) {
                throw new ServiceUnavailableError(
                    `Gemini request timed out (55s) for model "${this.model}".`
                );
            }
            throw new InternalServerError(`Gemini request failed: ${msg}`);
        }
    }
}

/** Gemini's REST API may reject or ignore `additionalProperties`; strip it before sending. */
function geminiResponseSchemaObject(schema: AiJsonSchema): Record<string, unknown> {
    const out = { ...(schema as unknown as Record<string, unknown>) };
    delete out.additionalProperties;
    return out;
}

function extractGeminiText(payload: unknown): string | null {
    if (typeof payload !== "object" || payload === null) return null;
    const candidates = (payload as { candidates?: unknown }).candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts;
    if (!Array.isArray(parts) || parts.length === 0) return null;
    const text = (parts[0] as { text?: unknown }).text;
    return typeof text === "string" && text.length > 0 ? text : null;
}
