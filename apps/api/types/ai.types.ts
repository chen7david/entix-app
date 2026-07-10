/** Provider-agnostic model id passed to the active inference backend. */
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
 * camelCase throughout — transformed to provider-specific params at the call boundary.
 */
export type AiGenerateOptions = {
    /** Max tokens to generate. */
    maxTokens?: number;
    /** Sampling temperature (0-2). Higher = more creative. */
    temperature?: number;
    /** Top-p nucleus sampling (0-1). */
    topP?: number;
    /** Optional structured output mode (Gemini json_schema; DeepSeek json_object). */
    responseFormat?: AiResponseFormat;
};

/**
 * Resolved AI service defaults: sampling params are always set; structured output remains optional.
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
 * Internal snake_case params passed directly to provider clients.
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

/** Shared surface implemented by DeepSeek and Gemini text clients. */
export type AiTextProvider = {
    generate(prompt: string, options?: AiGenerateOptions): Promise<AiGenerateResult>;
    chat(messages: AiMessage[], options?: AiGenerateOptions): Promise<AiGenerateResult>;
    getModel(): AiTextModel;
    getProvider(): "deepseek" | "gemini";
    stream(prompt: string, options?: AiGenerateOptions): Promise<ReadableStream>;
    fetchModels(): Promise<string[]>;
};

/** Shared config for text inference service construction. */
export type BaseAiServiceConfig = {
    apiKey: string;
    defaultModel: AiTextModel;
    systemPrompt?: string;
    defaults?: AiGenerateOptions;
};

/** @deprecated Use {@link BaseAiServiceConfig}. Kept for Gemini-only call sites. */
export type AiServiceConfig = BaseAiServiceConfig;
