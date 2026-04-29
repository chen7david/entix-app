/**
 * Catalogue of supported Cloudflare Workers AI text-generation models.
 * Add new entries here as Cloudflare expands the model list.
 * @see https://developers.cloudflare.com/workers-ai/models/
 */
export type AiTextModel =
    | "@cf/meta/llama-3.1-8b-instruct-fp8"
    | "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    | "@cf/mistral/mistral-7b-instruct-v0.1"
    | "@cf/google/gemma-7b-it-lora"
    | "@cf/microsoft/phi-2";

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
};

/**
 * Internal snake_case params passed directly to `ai.run()`.
 * Keeping this type explicit documents the camelCase -> snake_case transform boundary.
 */
export type AiRunParams = {
    max_tokens: number;
    temperature: number;
    top_p: number;
};

/** Normalized response from non-streaming calls. */
export type AiGenerateResult = {
    /** The generated text. */
    text: string;
    /** ISO-8601 timestamp of generation. */
    generatedAt: string;
};

/** Full config for AiService construction. */
export type AiServiceConfig = {
    /** Workers AI binding from the Cloudflare environment (`ctx.env.AI`). */
    ai: Ai;
    /** Model to run inference against. */
    model: AiTextModel;
    /** Optional system prompt prepended to every request. */
    systemPrompt?: string;
    /** Service-level generation defaults applied to every call unless overridden. */
    defaults?: AiGenerateOptions;
};
