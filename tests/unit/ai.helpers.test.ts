import { buildMessages, extractAiText, resolveAiRunParams } from "@api/helpers/ai.helpers";
import { describe, expect, it } from "vitest";

describe("ai.helpers", () => {
    it("resolves run params from defaults and overrides", () => {
        const params = resolveAiRunParams(
            { maxTokens: 123, topP: 0.5 },
            { maxTokens: 256, temperature: 0.7, topP: 1 }
        );

        expect(params).toEqual({
            max_tokens: 123,
            temperature: 0.7,
            top_p: 0.5,
        });
    });

    it("prepends system prompt when present", () => {
        const messages = buildMessages([{ role: "user", content: "hello" }], "system rules");
        expect(messages[0]).toEqual({ role: "system", content: "system rules" });
        expect(messages[1]).toEqual({ role: "user", content: "hello" });
    });

    it("returns same messages when no system prompt exists", () => {
        const original = [{ role: "user", content: "hello" }] as const;
        const messages = buildMessages([...original], undefined);
        expect(messages).toEqual(original);
    });

    it("extracts text from non-stream response", () => {
        expect(extractAiText({ response: "generated text" })).toBe("generated text");
    });

    it("returns null for stream and malformed payloads", () => {
        const stream = new ReadableStream({
            start(controller) {
                controller.close();
            },
        });

        expect(extractAiText(stream)).toBeNull();
        expect(extractAiText({})).toBeNull();
        expect(extractAiText({ response: "" })).toBeNull();
        expect(extractAiText("bad")).toBeNull();
    });
});
