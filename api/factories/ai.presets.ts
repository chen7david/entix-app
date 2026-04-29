import { LESSON_SYSTEM_PROMPT } from "@api/ai/prompts/lesson.prompt";
import { QUIZ_SYSTEM_PROMPT } from "@api/ai/prompts/quiz.prompt";
import { SUMMARY_SYSTEM_PROMPT } from "@api/ai/prompts/summary.prompt";
import type { AppContext } from "@api/helpers/types.helpers";
import type { AiService } from "@api/services/ai.service";
import { createAiService } from "./ai.factory";

export function createLessonAiService(ctx: AppContext): AiService {
    return createAiService(ctx, {
        model: "@cf/meta/llama-3.1-8b-instruct-fp8",
        systemPrompt: LESSON_SYSTEM_PROMPT,
        defaults: { maxTokens: 512, temperature: 0.7 },
    });
}

export function createQuizAiService(ctx: AppContext): AiService {
    return createAiService(ctx, {
        model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        systemPrompt: QUIZ_SYSTEM_PROMPT,
        defaults: { maxTokens: 1024, temperature: 0.3 },
    });
}

export function createSummaryAiService(ctx: AppContext): AiService {
    return createAiService(ctx, {
        model: "@cf/mistral/mistral-7b-instruct-v0.1",
        systemPrompt: SUMMARY_SYSTEM_PROMPT,
        defaults: { maxTokens: 256, temperature: 0.4 },
    });
}
