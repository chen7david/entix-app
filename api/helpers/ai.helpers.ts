import type { AiGenerateOptions, AiMessage, AiRunParams } from "@api/types/ai.types";

/**
 * Resolves per-call option overrides against service-level defaults.
 * Returns explicit snake_case params ready for `ai.run()`.
 */
export function resolveAiRunParams(
    overrides: AiGenerateOptions,
    defaults: Required<AiGenerateOptions>
): AiRunParams {
    return {
        max_tokens: overrides.maxTokens ?? defaults.maxTokens,
        temperature: overrides.temperature ?? defaults.temperature,
        top_p: overrides.topP ?? defaults.topP,
    };
}

/**
 * Prepends a system prompt message to a message array.
 * Returns the original array unchanged if no system prompt is provided.
 */
export function buildMessages(messages: AiMessage[], systemPrompt?: string): AiMessage[] {
    if (!systemPrompt) {
        return messages;
    }

    return [{ role: "system", content: systemPrompt }, ...messages];
}

/**
 * Safely extracts text from a Workers AI response.
 * Returns null when no usable text is present.
 */
export function extractAiText(response: unknown): string | null {
    if (response instanceof ReadableStream) {
        return null;
    }

    if (typeof response !== "object" || response === null) {
        return null;
    }

    const candidate = response as { response?: unknown };
    if (typeof candidate.response !== "string" || candidate.response.length === 0) {
        return null;
    }

    return candidate.response;
}
