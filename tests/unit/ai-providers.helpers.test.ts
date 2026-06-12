import {
    augmentMessagesForStructuredOutput,
    openAiResponseFormat,
} from "@api/helpers/ai-providers.helpers";
import { describe, expect, it } from "vitest";

describe("ai-providers.helpers", () => {
    it("openAiResponseFormat maps json_schema to json_object", () => {
        expect(
            openAiResponseFormat({
                type: "json_schema",
                json_schema: { type: "object", properties: {} },
            })
        ).toEqual({ type: "json_object" });
    });

    it("augmentMessagesForStructuredOutput appends schema hint to system message", () => {
        const messages = augmentMessagesForStructuredOutput(
            [{ role: "system", content: "You are helpful." }],
            {
                type: "json_schema",
                json_schema: {
                    type: "object",
                    properties: { foo: { type: "string" } },
                    required: ["foo"],
                },
            }
        );

        expect(messages[0]?.content).toContain("You are helpful.");
        expect(messages[0]?.content.toLowerCase()).toContain("json");
        expect(messages[0]?.content).toContain("foo");
    });
});
