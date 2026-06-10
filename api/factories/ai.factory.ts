import { AI_MODELS } from "@api/constants/ai.constants";
import type { AppContext } from "@api/helpers/types.helpers";
import { CloudflareKvCacheRepository } from "@api/repositories/kv-cache.repository";
import { AiService } from "@api/services/ai.service";
import { GeminiRateLimiter } from "@api/services/gemini-rate-limiter.service";
import type {
    AiGenerateOptions,
    AiServiceConfig,
    AiTextModel,
    AiTextProvider,
} from "@api/types/ai.types";

type AiServiceEnvSource = Pick<
    CloudflareBindings,
    "GEMINI_API_KEY" | "GEMINI_MODEL" | "IDEMPOTENCY_KV"
>;

function resolveGeminiRateLimiter(envLike: AiServiceEnvSource): GeminiRateLimiter | undefined {
    const kv = envLike.IDEMPOTENCY_KV;
    if (!kv || typeof kv !== "object" || !("get" in kv)) {
        return undefined;
    }
    return new GeminiRateLimiter(new CloudflareKvCacheRepository(kv));
}

/** Worker env → {@link AiService} (shared by HTTP routes and queue consumers). */
export function createAiServiceFromEnv(
    envLike: AiServiceEnvSource,
    config: Omit<AiServiceConfig, "apiKey" | "defaultModel" | "rateLimiter"> & {
        defaultModel?: AiTextModel;
    } = {}
): AiTextProvider {
    const apiKey = String(envLike.GEMINI_API_KEY ?? "").trim();
    const defaultModel = String(
        config.defaultModel ?? envLike.GEMINI_MODEL ?? AI_MODELS.DEFAULT
    ).trim();

    return new AiService({
        apiKey,
        defaultModel,
        systemPrompt: config.systemPrompt,
        defaults: config.defaults,
        rateLimiter: resolveGeminiRateLimiter(envLike),
    });
}

/**
 * Core AI factory. Resolves Google AI Studio secrets and model from Worker env.
 */
export function createAiService(
    ctx: AppContext,
    config: Omit<AiServiceConfig, "apiKey" | "defaultModel" | "rateLimiter"> & {
        defaultModel?: AiTextModel;
    }
): AiTextProvider {
    return createAiServiceFromEnv(ctx.env, config);
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
