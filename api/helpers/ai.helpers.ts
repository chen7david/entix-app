import type {
    AiGenerateDefaultsResolved,
    AiGenerateOptions,
    AiMessage,
    AiRunParams,
} from "@api/types/ai.types";

/**
 * Resolves per-call option overrides against service-level defaults.
 * Returns explicit snake_case params ready for `ai.run()`.
 */
export function resolveAiRunParams(
    overrides: AiGenerateOptions,
    defaults: AiGenerateDefaultsResolved
): AiRunParams {
    return {
        max_tokens: overrides.maxTokens ?? defaults.maxTokens,
        temperature: overrides.temperature ?? defaults.temperature,
        top_p: overrides.topP ?? defaults.topP,
        ...(overrides.responseFormat
            ? { response_format: overrides.responseFormat }
            : defaults.responseFormat
              ? { response_format: defaults.responseFormat }
              : {}),
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
 * Safely extracts text from Workers-style `{ response: string }` or OpenAI-compatible chat responses.
 *
 * @deprecated Production inference uses Gemini only; callers should use structured parsing for their provider.
 *             Retained for unit tests (`ai.helpers.test.ts`).
 */
export function extractAiText(response: unknown): string | null {
    if (response instanceof ReadableStream) {
        return null;
    }

    if (typeof response !== "object" || response === null) {
        return null;
    }

    const candidate = response as { response?: unknown; choices?: unknown };
    if (typeof candidate.response === "string" && candidate.response.length > 0) {
        return candidate.response;
    }

    if (Array.isArray(candidate.choices) && candidate.choices.length > 0) {
        const first = candidate.choices[0];
        if (typeof first === "object" && first !== null) {
            const message = (first as Record<string, unknown>).message;
            if (typeof message === "object" && message !== null) {
                const content = (message as Record<string, unknown>).content;
                if (typeof content === "string" && content.length > 0) {
                    return content;
                }
            }
        }
    }
    return null;
}
