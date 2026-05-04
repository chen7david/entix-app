import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { AiService } from "@api/services/ai.service";
import type { AiServiceConfig } from "@api/types/ai.types";
import { describe, expect, it, vi } from "vitest";

function buildService(): AiService {
    const config: AiServiceConfig = {
        apiKey: "test-key",
        endpoint: "https://ai.entix.org/api/chat/completions",
        defaultModel: "gemma:4eb4",
        systemPrompt: "system",
        defaults: { maxTokens: 64, temperature: 0.2, topP: 0.9 },
    };

    return new AiService(config);
}

describe("AiService", () => {
    it("throws when API key is missing", () => {
        expect(
            () =>
                new AiService({
                    apiKey: "",
                    endpoint: "https://ai.entix.org/api/chat/completions",
                    defaultModel: "gemma:4eb4",
                })
        ).toThrow(InternalServerError);
    });

    it("generates text and prepends system prompt", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    choices: [{ message: { content: "ok" } }],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            )
        );
        const service = buildService();

        const result = await service.generate("hello");

        expect(result.text).toBe("ok");
        expect(service.getModel()).toBe("gemma:4eb4");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const payload = JSON.parse(String(init.body)) as { messages: Array<{ role: string }> };
        expect(payload.messages[0].role).toBe("system");
        expect(payload.messages[1].role).toBe("user");
        fetchMock.mockRestore();
    });

    it("throws service unavailable when response text is missing", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({}), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        await expect(service.generate("hello")).rejects.toBeInstanceOf(ServiceUnavailableError);
        fetchMock.mockRestore();
    });

    it("response_format json_schema: serializes parsed object responses to text", async () => {
        const payload = { zh_translation: "你好", pinyin: "nǐ hǎo", needs_language_review: false };
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify(payload), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = new AiService({
            apiKey: "test-key",
            endpoint: "https://ai.entix.org/api/chat/completions",
            defaultModel: "gemma:4eb4",
            defaults: { maxTokens: 64, temperature: 0.2, topP: 0.9 },
        });

        const result = await service.generate("hello", {
            responseFormat: {
                type: "json_schema",
                json_schema: {
                    type: "object",
                    properties: {
                        zh_translation: { type: "string" },
                        pinyin: { type: "string" },
                        needs_language_review: { type: "boolean" },
                    },
                    required: ["zh_translation", "pinyin", "needs_language_review"],
                    additionalProperties: false,
                },
            },
        });

        expect(result.text).toBe(JSON.stringify(payload));
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const callPayload = JSON.parse(String(init.body)) as { response_format?: unknown };
        expect(callPayload.response_format).toEqual({
            type: "json_schema",
            json_schema: {
                name: "structured_output",
                schema: {
                    type: "object",
                    properties: {
                        zh_translation: { type: "string" },
                        pinyin: { type: "string" },
                        needs_language_review: { type: "boolean" },
                    },
                    required: ["zh_translation", "pinyin", "needs_language_review"],
                    additionalProperties: false,
                },
                strict: true,
            },
        });
        fetchMock.mockRestore();
    });

    it("response_format: still accepts legacy { response: string } shape", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    response: '{"zh_translation":"x","pinyin":"y","needs_language_review":false}',
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            )
        );
        const service = new AiService({
            apiKey: "test-key",
            endpoint: "https://ai.entix.org/api/chat/completions",
            defaultModel: "gemma:4eb4",
        });

        const result = await service.generate("hello", {
            responseFormat: { type: "json_object" },
        });

        expect(result.text).toBe(
            '{"zh_translation":"x","pinyin":"y","needs_language_review":false}'
        );
        fetchMock.mockRestore();
    });

    it("response_format: throws when response is neither string nor object", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response("null", {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = new AiService({
            apiKey: "test-key",
            endpoint: "https://ai.entix.org/api/chat/completions",
            defaultModel: "gemma:4eb4",
        });

        await expect(
            service.generate("hello", { responseFormat: { type: "json_object" } })
        ).rejects.toBeInstanceOf(ServiceUnavailableError);
        fetchMock.mockRestore();
    });

    it("streaming throws until enabled", async () => {
        const service = buildService();
        await expect(service.stream("hello")).rejects.toThrow(
            "Streaming is not enabled for Open WebUI integration."
        );
    });
});
