import type { AppContext } from "@api/helpers/types.helpers";
import { AiService } from "@api/services/ai.service";
import type { AiGenerateOptions, AiServiceConfig, AiTextModel } from "@api/types/ai.types";

/**
 * Core AI factory. Keeps AI binding injection in one place.
 */
export function createAiService(ctx: AppContext, config: Omit<AiServiceConfig, "ai">): AiService {
    return new AiService({ ai: ctx.env.AI, ...config });
}

/**
 * Creates an AiService with a caller-specified validated model.
 */
export function createAiServiceForModel(
    ctx: AppContext,
    model: AiTextModel,
    opts?: { systemPrompt?: string; defaults?: AiGenerateOptions }
): AiService {
    return createAiService(ctx, { model, ...opts });
}
