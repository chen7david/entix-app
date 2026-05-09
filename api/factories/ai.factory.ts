import { AI_MODELS } from "@api/constants/ai.constants";
import type { AppContext } from "@api/helpers/types.helpers";
import { AiService } from "@api/services/ai.service";
import type {
    AiGenerateOptions,
    AiServiceConfig,
    AiTextModel,
    AiTextProvider,
} from "@api/types/ai.types";

/** Worker env → {@link AiService} (shared by HTTP routes and queue consumers). */
export function createAiServiceFromEnv(
    envLike: Record<string, string | undefined>,
    config: Omit<AiServiceConfig, "apiKey" | "defaultModel"> & {
        defaultModel?: AiTextModel;
    } = {}
): AiTextProvider {
    const apiKey = (envLike.GEMINI_API_KEY ?? "").trim();
    const defaultModel = (config.defaultModel ?? envLike.GEMINI_MODEL ?? AI_MODELS.DEFAULT).trim();

    return new AiService({
        apiKey,
        defaultModel,
        systemPrompt: config.systemPrompt,
        defaults: config.defaults,
    });
}

/**
 * Core AI factory. Resolves Google AI Studio secrets and model from Worker env.
 */
export function createAiService(
    ctx: AppContext,
    config: Omit<AiServiceConfig, "apiKey" | "defaultModel"> & {
        defaultModel?: AiTextModel;
    }
): AiTextProvider {
    const env = ctx.env as unknown as Record<string, string | undefined>;
    return createAiServiceFromEnv(env, config);
}

/**
 * Creates an AiService with a caller-specified validated model.
 */
export function createAiServiceForModel(
    ctx: AppContext,
    model: AiTextModel,
    opts?: { systemPrompt?: string; defaults?: AiGenerateOptions }
): AiTextProvider {
    return createAiService(ctx, { defaultModel: model, ...opts });
}
