/** Gemini model id passed to `models/{id}:generateContent`. */
export type AiTextModel = string;

/** Role for a message turn in a chat conversation. */
export type AiMessageRole = "system" | "user" | "assistant";

/** A single message in a chat conversation. */
export type AiMessage = {
    role: AiMessageRole;
    content: string;
};

/**
 * Generation options settable at service-level (defaults) or per-call (overrides).
 * camelCase throughout — transformed to Cloudflare's snake_case only at the call boundary.
 */
export type AiGenerateOptions = {
    /** Max tokens to generate. */
    maxTokens?: number;
    /** Sampling temperature (0-2). Higher = more creative. */
    temperature?: number;
    /** Top-p nucleus sampling (0-1). */
    topP?: number;
    /** Optional structured output mode supported by Workers AI compatible APIs. */
    responseFormat?: AiResponseFormat;
};

/**
 * Resolved AiService defaults: sampling params are always set; structured output remains optional.
 * (Avoids `Required<AiGenerateOptions>`, which would incorrectly require `responseFormat`.)
 */
export type AiGenerateDefaultsResolved = Required<
    Pick<AiGenerateOptions, "maxTokens" | "temperature" | "topP">
> &
    Pick<AiGenerateOptions, "responseFormat">;

export type AiJsonSchema = {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
};

export type AiResponseFormat =
    | { type: "json_object" }
    | { type: "json_schema"; json_schema: AiJsonSchema };

/**
 * Internal snake_case params passed directly to `ai.run()`.
 * Keeping this type explicit documents the camelCase -> snake_case transform boundary.
 */
export type AiRunParams = {
    max_tokens: number;
    temperature: number;
    top_p: number;
    response_format?: AiResponseFormat;
};

/** Normalized response from non-streaming calls. */
export type AiGenerateResult = {
    /** The generated text. */
    text: string;
    /** ISO-8601 timestamp of generation. */
    generatedAt: string;
};

/** Shared surface implemented by {@link AiService}. */
export type AiTextProvider = {
    generate(prompt: string, options?: AiGenerateOptions): Promise<AiGenerateResult>;
    chat(messages: AiMessage[], options?: AiGenerateOptions): Promise<AiGenerateResult>;
    getModel(): AiTextModel;
    stream(prompt: string, options?: AiGenerateOptions): Promise<ReadableStream>;
    fetchModels(): Promise<string[]>;
};

import type { GeminiRateLimiter } from "@api/services/gemini-rate-limiter.service";

/** Full config for AiService construction (Google AI Studio). */
export type AiServiceConfig = {
    /** Google AI Studio / Gemini API key. */
    apiKey: string;
    /** Default model id (e.g. `gemini-2.5-flash`). */
    defaultModel: AiTextModel;
    /** Optional system prompt prepended to every request. */
    systemPrompt?: string;
    /** Service-level generation defaults applied to every call unless overridden. */
    defaults?: AiGenerateOptions;
    /** When set, every `generateContent` call acquires a slot before fetch (queue retries included). */
    rateLimiter?: GeminiRateLimiter;
};
