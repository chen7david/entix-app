import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { DeepSeekAiService } from "@api/services/deepseek-ai.service";
import type { BaseAiServiceConfig } from "@api/types/ai.types";
import { describe, expect, it, vi } from "vitest";

function openAiTextResponse(text: string): unknown {
    return {
        choices: [{ message: { role: "assistant", content: text } }],
    };
}

function buildService(): DeepSeekAiService {
    const config: BaseAiServiceConfig = {
        apiKey: "sk-test",
        defaultModel: "deepseek-v4-flash",
        systemPrompt: "system",
        defaults: { maxTokens: 64, temperature: 0.2, topP: 0.9 },
    };

    return new DeepSeekAiService(config);
}

describe("DeepSeekAiService", () => {
    it("throws when API key is missing", () => {
        expect(
            () => new DeepSeekAiService({ apiKey: "", defaultModel: "deepseek-v4-flash" })
        ).toThrow(InternalServerError);
    });

    it("generates text via DeepSeek chat completions with thinking disabled", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify(openAiTextResponse("ok")), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        const result = await service.generate("hello");

        expect(result.text).toBe("ok");
        expect(service.getModel()).toBe("deepseek-v4-flash");
        expect(service.getProvider()).toBe("deepseek");

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://api.deepseek.com/chat/completions");
        expect(init.headers).toMatchObject({
            Authorization: "Bearer sk-test",
        });
        const payload = JSON.parse(String(init.body)) as {
            model: string;
            thinking: { type: string };
            messages: Array<{ role: string; content: string }>;
        };
        expect(payload.model).toBe("deepseek-v4-flash");
        expect(payload.thinking).toEqual({ type: "disabled" });
        expect(payload.messages[0]).toEqual({ role: "system", content: "system" });
        fetchMock.mockRestore();
    });

    it("json_schema requests downgrade to json_object with schema in system prompt", async () => {
        const inner = { zh_translation: "你好", needs_language_review: false };
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify(openAiTextResponse(JSON.stringify(inner))), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        const schema = {
            type: "object" as const,
            properties: {
                zh_translation: { type: "string" },
                needs_language_review: { type: "boolean" },
            },
            required: ["zh_translation", "needs_language_review"],
        };

        const result = await service.generate("hello", {
            responseFormat: { type: "json_schema", json_schema: schema },
        });

        expect(result.text).toBe(JSON.stringify(inner));
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const payload = JSON.parse(String(init.body)) as {
            response_format: { type: string };
            messages: Array<{ role: string; content: string }>;
        };
        expect(payload.response_format).toEqual({ type: "json_object" });
        expect(payload.messages[0]?.content.toLowerCase()).toContain("json");
        expect(payload.messages[0]?.content).toContain("zh_translation");
        fetchMock.mockRestore();
    });

    it("lists models from DeepSeek /models", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        const models = await service.fetchModels();
        expect(models).toEqual(["deepseek-v4-flash"]);
        fetchMock.mockRestore();
    });

    it("throws service unavailable when response text is missing", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ choices: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );
        const service = buildService();

        await expect(service.generate("hello")).rejects.toBeInstanceOf(ServiceUnavailableError);
        fetchMock.mockRestore();
    });
});
