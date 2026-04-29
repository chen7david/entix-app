import { InternalServerError, ServiceUnavailableError } from "@api/errors/app.error";
import { AiService } from "@api/services/ai.service";
import type { AiServiceConfig } from "@api/types/ai.types";
import { describe, expect, it, vi } from "vitest";

type MockRun = ReturnType<typeof vi.fn>;

function buildService(runImpl: MockRun): AiService {
    const config: AiServiceConfig = {
        ai: { run: runImpl } as unknown as Ai,
        model: "@cf/meta/llama-3.1-8b-instruct-fp8",
        systemPrompt: "system",
        defaults: { maxTokens: 64, temperature: 0.2, topP: 0.9 },
    };

    return new AiService(config);
}

describe("AiService", () => {
    it("throws when AI binding is missing", () => {
        expect(
            () =>
                new AiService({
                    ai: undefined as unknown as Ai,
                    model: "@cf/meta/llama-3.1-8b-instruct-fp8",
                })
        ).toThrow(InternalServerError);
    });

    it("generates text and prepends system prompt", async () => {
        const run = vi.fn().mockResolvedValue({ response: "ok" });
        const service = buildService(run);

        const result = await service.generate("hello");

        expect(result.text).toBe("ok");
        expect(service.getModel()).toBe("@cf/meta/llama-3.1-8b-instruct-fp8");

        expect(run).toHaveBeenCalledTimes(1);
        const [, payload] = run.mock.calls[0] as [string, { messages: Array<{ role: string }> }];
        expect(payload.messages[0].role).toBe("system");
        expect(payload.messages[1].role).toBe("user");
    });

    it("throws service unavailable when response text is missing", async () => {
        const run = vi.fn().mockResolvedValue({});
        const service = buildService(run);

        await expect(service.generate("hello")).rejects.toBeInstanceOf(ServiceUnavailableError);
    });

    it("returns stream output for streaming calls", async () => {
        const stream = new ReadableStream({
            start(controller) {
                controller.close();
            },
        });
        const run = vi.fn().mockResolvedValue(stream);
        const service = buildService(run);

        const output = await service.stream("hello");
        expect(output).toBe(stream);
    });
});
