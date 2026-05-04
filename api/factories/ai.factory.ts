import { AI_ENDPOINTS, AI_MODELS } from "@api/constants/ai.constants";
import type { AppContext } from "@api/helpers/types.helpers";
import { AiService } from "@api/services/ai.service";
import type { AiGenerateOptions, AiServiceConfig, AiTextModel } from "@api/types/ai.types";

/**
 * Core AI factory. Keeps Open WebUI env injection in one place.
 */
export function createAiService(
    ctx: AppContext,
    config: Omit<AiServiceConfig, "apiKey" | "endpoint" | "defaultModel"> & {
        defaultModel?: AiTextModel;
    }
): AiService {
    const env = ctx.env as unknown as Record<string, string | undefined>;
    const apiKey = (env.OPENWEBUI_API_KEY ?? "").trim();
    const defaultModel = (env.OPENWEBUI_MODEL ?? AI_MODELS.DEFAULT).trim();
    const endpoint = (env.OPENWEBUI_ENDPOINT ?? AI_ENDPOINTS.DEFAULT).trim();

    return new AiService({
        apiKey,
        endpoint,
        defaultModel: config.defaultModel ?? defaultModel,
        ...config,
    });
}

/**
 * Creates an AiService with a caller-specified validated model.
 */
export function createAiServiceForModel(
    ctx: AppContext,
    model: AiTextModel,
    opts?: { systemPrompt?: string; defaults?: AiGenerateOptions }
): AiService {
    return createAiService(ctx, { defaultModel: model, ...opts });
}
