import { InternalServerError } from "@api/errors/app.error";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import type { AiJsonSchema } from "@api/types/ai.types";
import type { AiService } from "./ai.service";

type VocabularyTranslation = {
    normalized_text: string;
    zh_translation: string;
    pinyin: string;
    needs_language_review: boolean;
    ipa_us: string;
    syllables_en: string;
    syllables_ipa: string;
    definition_simple: string;
};

const VOCABULARY_TRANSLATION_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        normalized_text: {
            type: "string",
            description:
                "The canonical/normalized form of the input. Capitalize proper nouns (e.g. 'China', 'iPhone'), lowercase common nouns/verbs (e.g. 'apple', 'run').",
        },
        zh_translation: { type: "string" },
        pinyin: { type: "string" },
        needs_language_review: { type: "boolean" },
        ipa_us: { type: "string" },
        syllables_en: { type: "string" },
        syllables_ipa: { type: "string" },
        definition_simple: { type: "string" },
    },
    required: [
        "normalized_text",
        "zh_translation",
        "pinyin",
        "needs_language_review",
        "ipa_us",
        "syllables_en",
        "syllables_ipa",
        "definition_simple",
    ],
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
                "Translate this English phrase to Mandarin Chinese and provide linguistic metadata.",
                "1. Return 'normalized_text' as the canonical form: capitalize proper nouns (e.g. 'China', 'iPhone'), lowercase common nouns/verbs (e.g. 'apple', 'run').",
                "2. Return 'zh_translation' in Simplified Chinese characters (not English, never empty).",
                "3. If uncertain about translation quality, still provide your best translation and set needs_language_review to true.",
                "4. Return 'ipa_us' as the American English IPA transcription of the phrase.",
                "5. Return 'syllables_en' as the phrase with hyphen-separated syllables within each word, spaces preserved between words.",
                "6. Return 'syllables_ipa' as the IPA transcription with hyphen-separated syllables within each word, spaces preserved between words.",
                "7. Return 'definition_simple' as a 1-sentence definition a 7-year-old can understand.",
                `English phrase: "${item.text}"`,
            ].join("\n");

            const result = await this.aiService.generate(prompt, {
                temperature: 0.1,
                maxTokens: 1024,
                responseFormat: {
                    type: "json_schema",
                    json_schema: VOCABULARY_TRANSLATION_SCHEMA,
                },
            });

            const parsed = parseVocabularyTranslation(result.text);

            // Update with AI results, including the canonical casing
            const updateData: any = {
                zhTranslation: parsed.zh_translation,
                pinyin: parsed.pinyin,
                needsLanguageReview: parsed.needs_language_review,
                ipaUs: parsed.ipa_us,
                syllablesEn: parsed.syllables_en,
                syllablesIpa: parsed.syllables_ipa,
                definitionSimple: parsed.definition_simple,
            };

            // Only update text casing if it changed and doesn't conflict with another entry
            if (parsed.normalized_text !== item.text) {
                const existing = await this.vocabRepo.findByText(parsed.normalized_text);
                if (!existing) {
                    updateData.text = parsed.normalized_text;
                }
            }

            if (parsed.needs_language_review) {
                await this.vocabRepo.update(vocabularyId, {
                    ...updateData,
                    status: "review",
                });
                return;
            }

            await this.vocabRepo.update(vocabularyId, {
                ...updateData,
                status: "text_ready",
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
function parseVocabularyTranslation(raw: string): VocabularyTranslation {
    const parsed = JSON.parse(raw) as Partial<VocabularyTranslation>;

    if (
        typeof parsed.normalized_text !== "string" ||
        parsed.normalized_text.length === 0 ||
        typeof parsed.zh_translation !== "string" ||
        parsed.zh_translation.length === 0 ||
        typeof parsed.pinyin !== "string" ||
        parsed.pinyin.length === 0 ||
        typeof parsed.needs_language_review !== "boolean" ||
        typeof parsed.ipa_us !== "string" ||
        parsed.ipa_us.length === 0 ||
        typeof parsed.syllables_en !== "string" ||
        parsed.syllables_en.length === 0 ||
        typeof parsed.syllables_ipa !== "string" ||
        parsed.syllables_ipa.length === 0 ||
        typeof parsed.definition_simple !== "string" ||
        parsed.definition_simple.length === 0
    ) {
        throw new InternalServerError("Invalid translation payload from AI");
    }

    return {
        normalized_text: parsed.normalized_text,
        zh_translation: parsed.zh_translation,
        pinyin: parsed.pinyin,
        needs_language_review: parsed.needs_language_review,
        ipa_us: parsed.ipa_us,
        syllables_en: parsed.syllables_en,
        syllables_ipa: parsed.syllables_ipa,
        definition_simple: parsed.definition_simple,
    };
}
