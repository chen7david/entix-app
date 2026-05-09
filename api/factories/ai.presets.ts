import { LESSON_SYSTEM_PROMPT } from "@api/ai/prompts/lesson.prompt";
import { QUIZ_SYSTEM_PROMPT } from "@api/ai/prompts/quiz.prompt";
import { SUMMARY_SYSTEM_PROMPT } from "@api/ai/prompts/summary.prompt";
import { AI_MODELS } from "@api/constants/ai.constants";
import type { AppContext } from "@api/helpers/types.helpers";
import type { AiTextProvider } from "@api/types/ai.types";
import { createAiService } from "./ai.factory";

export function createLessonAiService(ctx: AppContext): AiTextProvider {
    return createAiService(ctx, {
        defaultModel: AI_MODELS.LESSON,
        systemPrompt: LESSON_SYSTEM_PROMPT,
        defaults: { maxTokens: 512, temperature: 0.7 },
    });
}

export function createQuizAiService(ctx: AppContext): AiTextProvider {
    return createAiService(ctx, {
        defaultModel: AI_MODELS.QUIZ,
        systemPrompt: QUIZ_SYSTEM_PROMPT,
        defaults: { maxTokens: 1024, temperature: 0.3 },
    });
}

export function createSummaryAiService(ctx: AppContext): AiTextProvider {
    return createAiService(ctx, {
        defaultModel: AI_MODELS.SUMMARY,
        systemPrompt: SUMMARY_SYSTEM_PROMPT,
        defaults: { maxTokens: 256, temperature: 0.4 },
    });
}
