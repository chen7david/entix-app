import type { AiMessage, AiResponseFormat } from "@api/types/ai.types";

/** Maps internal messages to OpenAI-compatible chat roles for DeepSeek. */
export function toOpenAiChatMessages(
    messages: AiMessage[]
): Array<{ role: string; content: string }> {
    return messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
}

/**
 * DeepSeek JSON mode requires "json" in the prompt and only supports `json_object`.
 * When callers request `json_schema`, embed the schema in the system message.
 */
export function augmentMessagesForStructuredOutput(
    messages: AiMessage[],
    responseFormat: AiResponseFormat | undefined
): AiMessage[] {
    if (!responseFormat) return messages;

    if (responseFormat.type === "json_object") {
        return appendJsonHint(messages, "Respond with valid JSON only.");
    }

    const schemaJson = JSON.stringify(responseFormat.json_schema);
    return appendJsonHint(
        messages,
        `Respond with valid JSON only, matching this schema:\n${schemaJson}`
    );
}

function appendJsonHint(messages: AiMessage[], hint: string): AiMessage[] {
    const systemIdx = messages.findIndex((m) => m.role === "system");
    if (systemIdx >= 0) {
        const copy = [...messages];
        const existing = copy[systemIdx];
        if (!existing) return messages;
        copy[systemIdx] = {
            ...existing,
            content: `${existing.content}\n\n${hint}`,
        };
        return copy;
    }

    return [{ role: "system", content: hint }, ...messages];
}

/** DeepSeek accepts json_object; Gemini-native json_schema is downgraded here. */
export function openAiResponseFormat(
    responseFormat: AiResponseFormat | undefined
): { type: "json_object" } | undefined {
    if (!responseFormat) return undefined;
    return { type: "json_object" };
}
