import {
    AI_REQUEST_TIMEOUT_MS,
    DEEPSEEK_API_BASE_URL,
    DEEPSEEK_MODELS,
} from "@api/constants/ai.constants";
import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { buildMessages, extractAiText, resolveAiRunParams } from "@api/helpers/ai.helpers";
import {
    augmentMessagesForStructuredOutput,
    openAiResponseFormat,
    toOpenAiChatMessages,
} from "@api/helpers/ai-providers.helpers";
import type {
    AiGenerateDefaultsResolved,
    AiGenerateOptions,
    AiGenerateResult,
    AiMessage,
    AiTextModel,
    BaseAiServiceConfig,
} from "@api/types/ai.types";
import { BaseService } from "./base.service";

export type DeepSeekAiServiceConfig = BaseAiServiceConfig & {
    /** Override API base (defaults to {@link DEEPSEEK_API_BASE_URL}). */
    baseUrl?: string;
};

/**
 * DeepSeek V4 OpenAI-compatible client (`https://api.deepseek.com/chat/completions`).
 * Uses non-thinking mode for structured JSON workloads (vocabulary pipeline, quizzes).
 */
export class DeepSeekAiService extends BaseService {
    private readonly apiKey: string;
    private readonly model: AiTextModel;
    private readonly baseUrl: string;
    private readonly systemPrompt: string | undefined;
    private readonly defaults: AiGenerateDefaultsResolved;

    constructor(config: DeepSeekAiServiceConfig) {
        super();

        if (!config.apiKey?.trim()) {
            throw new InternalServerError("DEEPSEEK_API_KEY is not configured.");
        }
        if (!config.defaultModel?.trim()) {
            throw new InternalServerError("DEEPSEEK_MODEL is not configured.");
        }

        this.apiKey = config.apiKey;
        this.model = config.defaultModel.trim();
        this.baseUrl = (config.baseUrl ?? DEEPSEEK_API_BASE_URL).replace(/\/$/, "");
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

    getProvider(): "deepseek" {
        return "deepseek";
    }

    async fetchModels(): Promise<string[]> {
        const url = `${this.baseUrl}/models`;

        const res = await fetch(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        const payload = (await res.json().catch(() => null)) as {
            data?: Array<{ id?: string }>;
            error?: { message?: string };
        } | null;

        if (!res.ok) {
            const detail =
                payload?.error?.message ??
                (payload !== null ? JSON.stringify(payload) : "empty response");
            throw new InternalServerError(`DeepSeek list models HTTP ${res.status}: ${detail}`);
        }

        const data = payload?.data;
        if (!Array.isArray(data)) {
            throw new ServiceUnavailableError("DeepSeek returned no models list.");
        }

        const ids = data
            .map((m) => m.id)
            .filter((id): id is string => typeof id === "string" && id.length > 0);

        if (ids.length === 0) {
            throw new ServiceUnavailableError("DeepSeek reported no chat models.");
        }

        return ids;
    }

    stream(_prompt: string, _options?: AiGenerateOptions): Promise<ReadableStream> {
        return Promise.reject(
            new ServiceUnavailableError("Streaming is not enabled for DeepSeek integration.")
        );
    }

    private async runChat(
        messages: AiMessage[],
        options: AiGenerateOptions
    ): Promise<AiGenerateResult> {
        const params = resolveAiRunParams(options, this.defaults);
        const structuredMessages = augmentMessagesForStructuredOutput(
            messages,
            params.response_format
        );

        const body: Record<string, unknown> = {
            model: this.model,
            messages: toOpenAiChatMessages(structuredMessages),
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            stream: false,
            thinking: { type: "disabled" },
        };

        const responseFormat = openAiResponseFormat(params.response_format);
        if (responseFormat) {
            body.response_format = responseFormat;
        }

        const url = `${this.baseUrl}/chat/completions`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const payload = await res.json().catch(() => null);
            if (!res.ok) {
                throw new InternalServerError(
                    `DeepSeek returned HTTP ${res.status}: ${JSON.stringify(payload)}`
                );
            }

            const text = extractAiText(payload);
            if (!text) {
                throw new ServiceUnavailableError(
                    `DeepSeek returned no text for model "${this.model}".`
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
                    `DeepSeek request timed out (${AI_REQUEST_TIMEOUT_MS / 1000}s) for model "${this.model}".`
                );
            }
            throw new InternalServerError(`DeepSeek request failed: ${msg}`);
        }
    }
}

/** Default DeepSeek model when env omits DEEPSEEK_MODEL. */
export const DEEPSEEK_DEFAULT_MODEL = DEEPSEEK_MODELS.DEFAULT;
