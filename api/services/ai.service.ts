import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { buildMessages, extractAiText, resolveAiRunParams } from "@api/helpers/ai.helpers";
import type {
    AiGenerateOptions,
    AiGenerateResult,
    AiMessage,
    AiServiceConfig,
    AiTextModel,
} from "@api/types/ai.types";
import { BaseService } from "./base.service";

/**
 * AiService orchestrates Cloudflare Workers AI calls with a clean, typed API.
 */
export class AiService extends BaseService {
    private readonly ai: Ai;
    private readonly model: AiTextModel;
    private readonly systemPrompt: string | undefined;
    private readonly defaults: Required<AiGenerateOptions>;

    constructor(config: AiServiceConfig) {
        super();

        if (!config.ai) {
            throw new InternalServerError(
                "Workers AI binding (AI) is not configured. " +
                    "Add an `ai` binding to wrangler and ensure ctx.env.AI is present."
            );
        }

        this.ai = config.ai;
        this.model = config.model;
        this.systemPrompt = config.systemPrompt;
        this.defaults = {
            maxTokens: config.defaults?.maxTokens ?? 256,
            temperature: config.defaults?.temperature ?? 0.7,
            topP: config.defaults?.topP ?? 1,
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

        let response: unknown;
        try {
            response = await this.ai.run(this.model, {
                messages,
                stream: false,
                ...params,
            });
        } catch (error) {
            throw new InternalServerError(
                `Workers AI run failed for model "${this.model}": ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        const text = extractAiText(response);
        if (text === null) {
            throw new ServiceUnavailableError(
                `Workers AI returned no text content for model "${this.model}".`
            );
        }

        return { text, generatedAt: new Date().toISOString() };
    }

    private async runStream(
        messages: AiMessage[],
        options: AiGenerateOptions
    ): Promise<ReadableStream> {
        const params = resolveAiRunParams(options, this.defaults);

        let response: unknown;
        try {
            response = await this.ai.run(this.model, {
                messages,
                stream: true,
                ...params,
            });
        } catch (error) {
            throw new InternalServerError(
                `Workers AI stream failed for model "${this.model}": ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }

        if (!(response instanceof ReadableStream)) {
            throw new ServiceUnavailableError(
                `Workers AI did not return a stream for model "${this.model}".`
            );
        }

        return response;
    }
}
