import {
    AI_MODELS,
    AI_PROVIDERS,
    type AiProvider,
    DEEPSEEK_MODELS,
    GEMINI_MODELS,
} from "@api/constants/ai.constants";
import type { AppContext } from "@api/helpers/types.helpers";
import { DeepSeekAiService } from "@api/services/deepseek-ai.service";
import { GeminiAiService } from "@api/services/gemini-ai.service";
import type {
    AiGenerateOptions,
    AiTextModel,
    AiTextProvider,
    BaseAiServiceConfig,
} from "@api/types/ai.types";

export type AiServiceEnvSource = Pick<
    CloudflareBindings,
    "AI_PROVIDER" | "DEEPSEEK_API_KEY" | "DEEPSEEK_MODEL" | "GEMINI_API_KEY" | "GEMINI_MODEL"
>;

function resolveAiProvider(envLike: AiServiceEnvSource): AiProvider {
    const raw = (envLike.AI_PROVIDER ?? AI_PROVIDERS.DEEPSEEK).trim().toLowerCase();
    if (raw === AI_PROVIDERS.GEMINI) return AI_PROVIDERS.GEMINI;
    return AI_PROVIDERS.DEEPSEEK;
}

/** Worker env → active text provider (DeepSeek by default, Gemini optional). */
export function createAiServiceFromEnv(
    envLike: AiServiceEnvSource,
    config: Omit<BaseAiServiceConfig, "apiKey" | "defaultModel"> & {
        defaultModel?: AiTextModel;
    } = {}
): AiTextProvider {
    const provider = resolveAiProvider(envLike);

    if (provider === AI_PROVIDERS.GEMINI) {
        const apiKey = (envLike.GEMINI_API_KEY ?? "").trim();
        const defaultModel = (
            config.defaultModel ??
            envLike.GEMINI_MODEL ??
            GEMINI_MODELS.DEFAULT
        ).trim();

        return new GeminiAiService({
            apiKey,
            defaultModel,
            systemPrompt: config.systemPrompt,
            defaults: config.defaults,
        });
    }

    const apiKey = (envLike.DEEPSEEK_API_KEY ?? "").trim();
    const defaultModel = (
        config.defaultModel ??
        envLike.DEEPSEEK_MODEL ??
        AI_MODELS.DEFAULT
    ).trim();

    return new DeepSeekAiService({
        apiKey,
        defaultModel,
        systemPrompt: config.systemPrompt,
        defaults: config.defaults,
    });
}

/** Core AI factory. Resolves provider secrets and model from Worker env. */
export function createAiService(
    ctx: AppContext,
    config: Omit<BaseAiServiceConfig, "apiKey" | "defaultModel"> & {
        defaultModel?: AiTextModel;
    }
): AiTextProvider {
    return createAiServiceFromEnv(ctx.env, config);
}

/** Creates a text provider with a caller-specified validated model. */
export function createAiServiceForModel(
    ctx: AppContext,
    model: AiTextModel,
    opts?: { systemPrompt?: string; defaults?: AiGenerateOptions }
): AiTextProvider {
    return createAiService(ctx, { defaultModel: model, ...opts });
}

/** Exported for tests and diagnostics. */
export { AI_PROVIDERS, DEEPSEEK_MODELS, GEMINI_MODELS, resolveAiProvider };
