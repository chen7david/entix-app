import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { buildMessages, extractAiText, resolveAiRunParams } from "@api/helpers/ai.helpers";
import type {
    AiGenerateDefaultsResolved,
    AiGenerateOptions,
    AiGenerateResult,
    AiMessage,
    AiServiceConfig,
    AiTextModel,
} from "@api/types/ai.types";
import { BaseService } from "./base.service";

/**
 * AiService orchestrates Open WebUI (OpenAI-compatible) calls with a clean, typed API.
 */
export class AiService extends BaseService {
    private readonly apiKey: string;
    private readonly endpoint: string;
    private readonly model: AiTextModel;
    private readonly systemPrompt: string | undefined;
    private readonly defaults: AiGenerateDefaultsResolved;

    constructor(config: AiServiceConfig) {
        super();

        if (!config.apiKey || config.apiKey.trim().length === 0) {
            throw new InternalServerError("OPEN_WEB_UI_API_KEY is not configured.");
        }
        if (!config.defaultModel || config.defaultModel.trim().length === 0) {
            throw new InternalServerError("OPEN_WEB_UI_MODEL is not configured.");
        }
        if (!config.endpoint || config.endpoint.trim().length === 0) {
            throw new InternalServerError("OPEN_WEB_UI_ENDPOINT is not configured.");
        }

        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint;
        this.model = config.defaultModel;
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
        const fullMessages = buildMessages(messages, this.systemPrompt);
        return this.runChat(fullMessages, options);
    }

    async stream(prompt: string, options: AiGenerateOptions = {}): Promise<ReadableStream> {
        const messages = buildMessages([{ role: "user", content: prompt }], this.systemPrompt);
        return this.runStream(messages, options);
    }

    getModel(): AiTextModel {
        return this.model;
    }

    private async runChat(
        messages: AiMessage[],
        options: AiGenerateOptions
    ): Promise<AiGenerateResult> {
        const params = resolveAiRunParams(options, this.defaults);
        const requestParams = normalizeOpenWebUiParams(params);

        const response = await this.executeChatRequest(messages, requestParams);
        return this.processChatResponse(response, params);
    }

    private async executeChatRequest(
        messages: AiMessage[],
        requestParams: Record<string, unknown>
    ): Promise<unknown> {
        try {
            const res = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    stream: false,
                    ...requestParams,
                }),
            });

            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                const errorDetail =
                    payload && typeof payload === "object"
                        ? JSON.stringify(payload)
                        : "empty response";
                throw new InternalServerError(
                    `AI provider returned HTTP ${res.status}: ${errorDetail}`
                );
            }

            return payload;
        } catch (error: unknown) {
            if (error instanceof InternalServerError) throw error;

            const message = error instanceof Error ? error.message : String(error);
            throw new InternalServerError(
                `Open WebUI request failed for model "${this.model}": ${message}`
            );
        }
    }

    private processChatResponse(
        response: unknown,
        params: ReturnType<typeof resolveAiRunParams>
    ): AiGenerateResult {
        const text = extractAiText(response);

        if (text === null) {
            if (params.response_format && typeof response === "object" && response !== null) {
                return {
                    text: JSON.stringify(response),
                    generatedAt: new Date().toISOString(),
                };
            }
            throw new ServiceUnavailableError(
                `Open WebUI returned no text content for model "${this.model}".`
            );
        }

        return { text, generatedAt: new Date().toISOString() };
    }

    async fetchModels(): Promise<string[]> {
        const tried: string[] = [];
        const root = this.endpoint.replace(/\/chat\/completions$/, "");
        const urls = [
            `${root}/models`,
            `${root.replace(/\/api$/, "")}/api/models`,
            `${this.endpoint.replace(/\/chat\/completions$/, "")}/models`,
        ];

        for (const url of urls) {
            if (tried.includes(url)) continue;
            tried.push(url);

            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                });

                if (!res.ok) continue;

                const payload = (await res.json().catch(() => null)) as Record<
                    string,
                    unknown
                > | null;
                const data = payload?.data;

                if (Array.isArray(data)) {
                    return data
                        .map((item) => {
                            if (typeof item !== "object" || item === null) return null;
                            const id = (item as Record<string, unknown>).id;
                            return typeof id === "string" && id.trim().length > 0 ? id : null;
                        })
                        .filter((id): id is string => id !== null);
                }
            } catch {}
        }

        throw new ServiceUnavailableError(
            `Unable to load models from Open WebUI. Tried: ${tried.join(", ")}`
        );
    }

    private async runStream(
        messages: AiMessage[],
        options: AiGenerateOptions
    ): Promise<ReadableStream> {
        void messages;
        void options;
        throw new ServiceUnavailableError("Streaming is not enabled for Open WebUI integration.");
    }
}

function normalizeOpenWebUiParams(
    params: ReturnType<typeof resolveAiRunParams>
): Record<string, unknown> {
    if (!params.response_format || params.response_format.type !== "json_schema") {
        return params as unknown as Record<string, unknown>;
    }
    return {
        ...params,
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "structured_output",
                schema: params.response_format.json_schema,
                strict: true,
            },
        },
    };
}
