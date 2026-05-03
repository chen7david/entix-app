import { InternalServerError } from "@api/errors/app.error";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import type { AiJsonSchema } from "@api/types/ai.types";
import type { AiService } from "./ai.service";

type VocabularyTranslation = {
    zh_translation: string;
    pinyin: string;
    needs_language_review?: boolean;
};

const VOCABULARY_TRANSLATION_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        zh_translation: { type: "string" },
        pinyin: { type: "string" },
        needs_language_review: { type: "boolean" },
    },
    required: ["zh_translation", "pinyin", "needs_language_review"],
    additionalProperties: false,
};

export type VocabularyProcessingDeps = {
    /** Pipeline / infra failures only — content-quality review uses status `review` via AI flag. */
    logPipelineFailure: (
        phase: "text" | "audio",
        vocabularyId: string,
        error: unknown
    ) => Promise<void>;
};

export class VocabularyProcessingService {
    constructor(
        private readonly vocabRepo: VocabularyBankRepository,
        private readonly aiService: AiService,
        private readonly deps?: VocabularyProcessingDeps
    ) {}

    async processText(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || (item.status !== "new" && item.status !== "processing_text")) {
            return;
        }

        await this.vocabRepo.updateStatus(vocabularyId, "processing_text");

        try {
            const prompt = [
                "Translate this English phrase to Mandarin Chinese.",
                "Set needs_language_review to true only if the phrase is misspelled, ungrammatical, or unsuitable study vocabulary.",
                `English phrase: "${item.text}"`,
            ].join("\n");

            const result = await this.aiService.generate(prompt, {
                temperature: 0.1,
                maxTokens: 512,
                responseFormat: {
                    type: "json_schema",
                    json_schema: VOCABULARY_TRANSLATION_SCHEMA,
                },
            });

            const parsed = parseVocabularyTranslation(result.text);

            if (parsed.needs_language_review) {
                await this.vocabRepo.updateStatus(vocabularyId, "review", {
                    zhTranslation: parsed.zh_translation,
                    pinyin: parsed.pinyin,
                });
                return;
            }

            await this.vocabRepo.updateStatus(vocabularyId, "text_ready", {
                zhTranslation: parsed.zh_translation,
                pinyin: parsed.pinyin,
            });

            // TTS provider is not wired yet, so transition directly to active text-only entries.
            await this.vocabRepo.updateStatus(vocabularyId, "active");
        } catch (error: unknown) {
            await this.deps?.logPipelineFailure("text", vocabularyId, error);
            throw error;
        }
    }

    async processAudio(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || (item.status !== "text_ready" && item.status !== "processing_audio")) {
            return;
        }

        // Temporary text-only mode: processAudio should not fail jobs while TTS is unavailable.
        await this.vocabRepo.updateStatus(vocabularyId, "active");
    }
}

/**
 * Runtime type guard for model output.
 * With response_format json_schema enabled, this is defensive validation rather than extraction.
 */
function parseVocabularyTranslation(
    raw: string
): VocabularyTranslation & { needs_language_review: boolean } {
    const parsed = JSON.parse(raw) as Partial<VocabularyTranslation> & {
        needs_language_review?: unknown;
    };
    const needs_language_review = parsed.needs_language_review;

    if (
        typeof parsed.zh_translation !== "string" ||
        parsed.zh_translation.length === 0 ||
        typeof parsed.pinyin !== "string" ||
        parsed.pinyin.length === 0 ||
        typeof needs_language_review !== "boolean"
    ) {
        throw new InternalServerError("Invalid translation payload from AI");
    }

    return {
        zh_translation: parsed.zh_translation,
        pinyin: parsed.pinyin,
        needs_language_review,
    };
}
