import { AI_PROVIDERS, DEEPSEEK_MODELS, GEMINI_MODELS } from "@api/constants/ai.constants";
import {
    type AiServiceEnvSource,
    createAiServiceFromEnv,
    resolveAiProvider,
} from "@api/factories/ai.factory";
import { DeepSeekAiService } from "@api/services/ai/deepseek-ai.service";
import { GeminiAiService } from "@api/services/ai/gemini-ai.service";
import { describe, expect, it } from "vitest";

describe("createAiServiceFromEnv", () => {
    it("defaults to DeepSeek when AI_PROVIDER is unset", () => {
        const service = createAiServiceFromEnv({
            DEEPSEEK_API_KEY: "sk-test",
            DEEPSEEK_MODEL: DEEPSEEK_MODELS.DEFAULT,
        } as AiServiceEnvSource);

        expect(service).toBeInstanceOf(DeepSeekAiService);
        expect(service.getProvider()).toBe("deepseek");
        expect(service.getModel()).toBe(DEEPSEEK_MODELS.DEFAULT);
    });

    it("returns Gemini when AI_PROVIDER is gemini", () => {
        const service = createAiServiceFromEnv({
            AI_PROVIDER: AI_PROVIDERS.GEMINI,
            GEMINI_API_KEY: "gemini-key",
            GEMINI_MODEL: GEMINI_MODELS.DEFAULT,
        } as AiServiceEnvSource);

        expect(service).toBeInstanceOf(GeminiAiService);
        expect(service.getProvider()).toBe("gemini");
        expect(service.getModel()).toBe(GEMINI_MODELS.DEFAULT);
    });

    it("resolveAiProvider treats unknown values as deepseek", () => {
        expect(resolveAiProvider({ AI_PROVIDER: "unknown" } as AiServiceEnvSource)).toBe(
            AI_PROVIDERS.DEEPSEEK
        );
    });
});
