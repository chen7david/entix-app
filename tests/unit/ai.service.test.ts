import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { GeminiAiService } from "@api/services/ai/gemini-ai.service";
import type { BaseAiServiceConfig } from "@api/types/ai.types";
import { describe, expect, it, vi } from "vitest";

function geminiTextResponse(text: string): unknown {
    return {
        candidates: [{ content: { parts: [{ text }] } }],
    };
}

function buildService(): GeminiAiService {
    const config: BaseAiServiceConfig = {
        apiKey: "test-key",
        defaultModel: "gemini-test",
        systemPrompt: "system",
        defaults: { maxTokens: 64, temperature: 0.2, topP: 0.9 },
    };

    return new GeminiAiService(config);
}

describe("GeminiAiService", () => {
    it("throws when API key is missing", () => {
        expect(() => new GeminiAiService({ apiKey: "", defaultModel: "gemini-test" })).toThrow(
            InternalServerError
        );
    });

    it("generates text via Gemini and splits systemInstruction from user contents", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify(geminiTextResponse("ok")), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        const result = await service.generate("hello");

        expect(result.text).toBe("ok");
        expect(service.getModel()).toBe("gemini-test");
        expect(service.getProvider()).toBe("gemini");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toContain("gemini-test:generateContent");
        expect(url).toContain("key=test-key");
        const payload = JSON.parse(String(init.body)) as {
            systemInstruction?: { parts: Array<{ text: string }> };
            contents: Array<{ role: string }>;
        };
        expect(payload.systemInstruction?.parts[0].text).toBe("system");
        expect(payload.contents[0].role).toBe("user");
        fetchMock.mockRestore();
    });

    it("throws service unavailable when response text is missing", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ candidates: [{ content: { parts: [{}] } }] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        await expect(service.generate("hello")).rejects.toBeInstanceOf(ServiceUnavailableError);
        fetchMock.mockRestore();
    });

    it("response_format json_schema: sends responseSchema and returns model JSON text", async () => {
        const inner = { zh_translation: "你好", pinyin: "nǐ hǎo", needs_language_review: false };
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify(geminiTextResponse(JSON.stringify(inner))), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = new GeminiAiService({
            apiKey: "test-key",
            defaultModel: "gemini-test",
            defaults: { maxTokens: 64, temperature: 0.2, topP: 0.9 },
        });

        const schema = {
            type: "object" as const,
            properties: {
                zh_translation: { type: "string" },
                pinyin: { type: "string" },
                needs_language_review: { type: "boolean" },
            },
            required: ["zh_translation", "pinyin", "needs_language_review"],
            additionalProperties: false,
        };

        const result = await service.generate("hello", {
            responseFormat: {
                type: "json_schema",
                json_schema: schema,
            },
        });

        expect(result.text).toBe(JSON.stringify(inner));
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const callPayload = JSON.parse(String(init.body)) as {
            generationConfig: {
                responseMimeType?: string;
                responseSchema?: typeof schema;
            };
        };
        expect(callPayload.generationConfig.responseMimeType).toBe("application/json");
        const schemaForGemini = { ...schema };
        delete (schemaForGemini as { additionalProperties?: boolean }).additionalProperties;
        expect(callPayload.generationConfig.responseSchema).toEqual(schemaForGemini);
        fetchMock.mockRestore();
    });

    it("streaming throws until enabled", async () => {
        const service = buildService();
        await expect(service.stream("hello")).rejects.toThrow(
            "Streaming is not enabled for Gemini integration."
        );
    });
});

/** Backward-compatible suite name for CI grep / historical references. */
describe("AiService (Gemini alias)", () => {
    it("re-exports GeminiAiService", async () => {
        const { AiService } = await import("@api/services/ai/ai.service");
        expect(AiService).toBe(GeminiAiService);
    });
});
