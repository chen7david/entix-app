import { InternalServerError } from "@api/errors/app.error";
import type { UploadRepository } from "@api/repositories/upload.repository";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import type { AiJsonSchema, AiTextProvider } from "@api/types/ai.types";
import { PLATFORM_ORGANIZATION_ID } from "@shared";
import { pinyin } from "pinyin-pro";
import type { TtsAudioResult, TtsService } from "./tts.service";

/** Max output tokens per phrase (single or batched). */
export const VOCABULARY_TEXT_MAX_TOKENS = 512;

/** Phrases per AI request — aligned with queue `max_batch_size`. */
export const VOCABULARY_TEXT_BATCH_SIZE = 5;

/** Max vocabulary rows the cron dispatcher claims per minute. */
export const VOCABULARY_PIPELINE_DISPATCH_LIMIT = 10;

export type VocabularyTranslation = {
    normalized_text: string;
    zh_translation: string;
    needs_language_review: boolean;
    ipa_us: string;
    syllables_en: string;
    syllables_ipa: string;
    definition_simple: string;
};

export const VOCABULARY_TRANSLATION_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        normalized_text: {
            type: "string",
            description:
                "The canonical/normalized form of the input. Capitalize proper nouns (e.g. 'China', 'iPhone'), lowercase common nouns/verbs (e.g. 'apple', 'run').",
        },
        zh_translation: { type: "string" },
        needs_language_review: { type: "boolean" },
        ipa_us: {
            type: "string",
            description:
                "American English IPA transcription of the phrase, no surrounding slashes (e.g. ˈmɪl.jən).",
        },
        syllables_en: { type: "string" },
        syllables_ipa: {
            type: "string",
            description:
                "IPA with hyphen-separated syllables within each word, spaces preserved between words, no surrounding slashes (e.g. ˈmɪl-jən).",
        },
        definition_simple: { type: "string" },
    },
    required: [
        "normalized_text",
        "zh_translation",
        "needs_language_review",
        "ipa_us",
        "syllables_en",
        "syllables_ipa",
        "definition_simple",
    ],
    additionalProperties: false,
};

export const VOCABULARY_TRANSLATION_BATCH_SCHEMA: AiJsonSchema = {
    type: "object",
    properties: {
        translations: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    vocabulary_id: {
                        type: "string",
                        description: "Must match the input id for this phrase.",
                    },
                    ...VOCABULARY_TRANSLATION_SCHEMA.properties,
                },
                required: ["vocabulary_id", ...(VOCABULARY_TRANSLATION_SCHEMA.required ?? [])],
                additionalProperties: false,
            },
        },
    },
    required: ["translations"],
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

export const VOCABULARY_TRANSLATION_INSTRUCTIONS = [
    "Translate this English phrase to Mandarin Chinese and provide linguistic metadata.",
    "1. Return 'normalized_text' as the canonical form: capitalize proper nouns (e.g. 'China', 'iPhone'), lowercase common nouns/verbs (e.g. 'apple', 'run').",
    "2. Return 'zh_translation' in Simplified Chinese characters (not English, never empty).",
    "3. If uncertain about translation quality, still provide your best translation and set 'needs_language_review' to true.",
    "4. Return 'ipa_us' as the American English IPA transcription, without surrounding slashes (e.g. ˈmɪl.jən not /ˈmɪl.jən/).",
    "5. Return 'syllables_en' as the phrase with hyphen-separated syllables within each word, spaces preserved between words.",
    "6. Return 'syllables_ipa' as the IPA transcription with hyphen-separated syllables within each word, spaces preserved between words, without surrounding slashes.",
    "7. Return 'definition_simple' as a 1-sentence definition a 7-year-old can understand.",
].join("\n");

export const VOCABULARY_TRANSLATION_BATCH_INSTRUCTIONS = [
    VOCABULARY_TRANSLATION_INSTRUCTIONS,
    "8. When given multiple phrases, return a JSON object with a 'translations' array — one entry per input phrase, each including 'vocabulary_id' matching the id provided.",
].join("\n");

/** Split vocabulary ids into fixed-size queue batches. */
export function chunkVocabularyIds(ids: string[], size = VOCABULARY_TEXT_BATCH_SIZE): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += size) {
        chunks.push(ids.slice(i, i + size));
    }
    return chunks;
}

export class VocabularyProcessingService {
    constructor(
        private readonly vocabRepo: VocabularyBankRepository,
        private readonly aiService: AiTextProvider,
        private readonly ttsService: TtsService,
        /** Omit only in narrow tests; production queue handlers should always supply audit logging. */
        private readonly deps?: VocabularyProcessingDeps,
        private readonly uploadRepo?: UploadRepository
    ) {}

    async processText(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || !["new", "queued_text", "processing_text"].includes(item.status)) {
            return;
        }

        await this.vocabRepo.updateStatus(vocabularyId, "processing_text");

        try {
            const phrase = item.text;
            // Instructions live in AiService systemPrompt (queue handler / factory) — user turn is phrase only.
            const prompt = `English phrase: "${phrase}"`;

            const result = await this.aiService.generate(prompt, {
                temperature: 0.1,
                maxTokens: VOCABULARY_TEXT_MAX_TOKENS,
                responseFormat: {
                    type: "json_schema",
                    json_schema: VOCABULARY_TRANSLATION_SCHEMA,
                },
            });

            const parsed = parseVocabularyTranslation(result.text, item.text);
            await this.applyTextTranslation(vocabularyId, item.text, parsed);
        } catch (error: unknown) {
            await this.emitPipelineFailure("text", vocabularyId, error);
            throw error;
        }
    }

    async processTextBatch(vocabularyIds: string[]): Promise<void> {
        const uniqueIds = [...new Set(vocabularyIds.filter(Boolean))];
        if (uniqueIds.length === 0) {
            return;
        }

        if (uniqueIds.length === 1) {
            const [singleId] = uniqueIds;
            if (singleId) {
                await this.processText(singleId);
            }
            return;
        }

        const items = await Promise.all(uniqueIds.map((id) => this.vocabRepo.findById(id)));
        const workItems = uniqueIds
            .map((vocabularyId, index) => ({ item: items[index], vocabularyId }))
            .filter(
                (
                    entry
                ): entry is {
                    item: NonNullable<(typeof items)[number]>;
                    vocabularyId: string;
                } =>
                    !!entry.item &&
                    ["new", "queued_text", "processing_text"].includes(entry.item.status)
            );

        if (workItems.length === 0) {
            return;
        }

        await Promise.all(
            workItems.map(({ vocabularyId }) =>
                this.vocabRepo.updateStatus(vocabularyId, "processing_text")
            )
        );

        const promptLines = workItems.map(
            ({ item, vocabularyId }, index) => `${index + 1}. id="${vocabularyId}": "${item.text}"`
        );
        const prompt = `Translate each English phrase below.\n\n${promptLines.join("\n")}`;

        try {
            const result = await this.aiService.generate(prompt, {
                temperature: 0.1,
                maxTokens: VOCABULARY_TEXT_MAX_TOKENS * workItems.length,
                responseFormat: {
                    type: "json_schema",
                    json_schema: VOCABULARY_TRANSLATION_BATCH_SCHEMA,
                },
            });

            const expectedIds = new Set(workItems.map(({ vocabularyId }) => vocabularyId));
            const translations = parseVocabularyTranslationBatch(
                result.text,
                expectedIds,
                new Map(workItems.map(({ item, vocabularyId }) => [vocabularyId, item.text]))
            );

            for (const { item, vocabularyId } of workItems) {
                const parsed = translations.get(vocabularyId);
                if (!parsed) {
                    await this.emitPipelineFailure(
                        "text",
                        vocabularyId,
                        new InternalServerError("Missing translation in batch AI response")
                    );
                    continue;
                }

                try {
                    await this.applyTextTranslation(vocabularyId, item.text, parsed);
                } catch (error: unknown) {
                    await this.emitPipelineFailure("text", vocabularyId, error);
                }
            }
        } catch (error: unknown) {
            await Promise.all(
                workItems.map(({ vocabularyId }) =>
                    this.emitPipelineFailure("text", vocabularyId, error)
                )
            );
            throw error;
        }
    }

    private async applyTextTranslation(
        vocabularyId: string,
        originalText: string,
        parsed: VocabularyTranslation
    ): Promise<void> {
        const pinyinValue = pinyin(parsed.zh_translation, {
            toneType: "symbol",
            separator: " ",
        });

        const updateData: Record<string, unknown> = {
            zhTranslation: parsed.zh_translation,
            pinyin: pinyinValue,
            needsLanguageReview: parsed.needs_language_review,
            ipaUs: parsed.ipa_us,
            syllablesEn: parsed.syllables_en,
            syllablesIpa: parsed.syllables_ipa,
            definitionSimple: parsed.definition_simple,
        };

        if (parsed.normalized_text !== originalText) {
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
    }

    async processAudio(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || !["text_ready", "queued_audio", "processing_audio"].includes(item.status)) {
            return;
        }

        if (!item.zhTranslation) {
            throw new InternalServerError("Cannot process audio: zhTranslation is missing");
        }
        if (!item.text?.trim()) {
            throw new InternalServerError("Cannot process audio: text is missing or empty");
        }

        await this.vocabRepo.updateStatus(vocabularyId, "processing_audio");

        try {
            const ttsResult: TtsAudioResult = await this.ttsService.generateAndUpload(
                vocabularyId,
                item.text,
                item.zhTranslation
            );

            if (this.uploadRepo) {
                const organizationId = PLATFORM_ORGANIZATION_ID;
                try {
                    await Promise.all([
                        this.ensureVocabularyAudioUploadRecord({
                            organizationId,
                            bucketKey: ttsResult.enBucketKey,
                            url: ttsResult.enAudioUrl,
                            originalName: `vocabulary-${vocabularyId}-en.mp3`,
                            fileSize: ttsResult.enBytes,
                        }),
                        this.ensureVocabularyAudioUploadRecord({
                            organizationId,
                            bucketKey: ttsResult.zhBucketKey,
                            url: ttsResult.zhAudioUrl,
                            originalName: `vocabulary-${vocabularyId}-zh.mp3`,
                            fileSize: ttsResult.zhBytes,
                        }),
                    ]);
                } catch (registryError: unknown) {
                    console.error(
                        "[VocabularyProcessingService] Uploads registry failed after TTS; deleting bucket objects then rethrowing:",
                        registryError
                    );
                    await this.ttsService
                        .deleteUploadedAudio(ttsResult)
                        .catch((cleanupErr: unknown) => {
                            console.error(
                                "[VocabularyProcessingService] Failed to delete orphaned TTS objects after uploads registry error:",
                                cleanupErr
                            );
                        });
                    throw registryError;
                }
            } else {
                console.warn(
                    "[VocabularyProcessingService] uploadRepo not configured — TTS audio is not registered in uploads (Files & Uploads)."
                );
            }

            await this.vocabRepo.update(vocabularyId, {
                enAudioUrl: ttsResult.enAudioUrl,
                zhAudioUrl: ttsResult.zhAudioUrl,
                status: "active",
            });
        } catch (error: unknown) {
            await this.emitPipelineFailure("audio", vocabularyId, error);
            throw error;
        }
    }

    private async emitPipelineFailure(
        phase: "text" | "audio",
        vocabularyId: string,
        error: unknown
    ): Promise<void> {
        if (this.deps?.logPipelineFailure) {
            await this.deps.logPipelineFailure(phase, vocabularyId, error);
            return;
        }
        console.warn(
            `[VocabularyProcessingService] Pipeline failure (${phase}) with no logPipelineFailure hook configured:`,
            error
        );
    }

    /** Vocabulary bank rows are platform-global; uploads are attributed to the platform org. */
    private async ensureVocabularyAudioUploadRecord(input: {
        organizationId: string;
        bucketKey: string;
        /** Public CDN URL (matches `en_audio_url` / `zh_audio_url` on vocabulary_bank). */
        url: string;
        originalName: string;
        fileSize: number;
    }): Promise<void> {
        if (!this.uploadRepo) return;
        const existing = await this.uploadRepo.findUploadByBucketKey(
            input.bucketKey,
            input.organizationId
        );
        if (existing) return;
        await this.uploadRepo.create({
            id: crypto.randomUUID(),
            organizationId: input.organizationId,
            originalName: input.originalName,
            bucketKey: input.bucketKey,
            url: input.url,
            fileSize: input.fileSize,
            contentType: "audio/mpeg",
            uploadedBy: null,
            status: "completed",
        });
    }
}

/**
 * Runtime type guard for model output.
 * With response_format json_schema enabled, this is defensive validation rather than extraction.
 */
/** Defensive unwrap when the model echoes IPA with orthographic slashes (any leading/trailing slash, not only a matched pair). */
function stripIpaSlashes(s: string): string {
    return s
        .trim()
        .replace(/^\/+|\/+$/g, "")
        .trim();
}

function parseVocabularyTranslationBatch(
    raw: string,
    expectedIds: Set<string>,
    fallbackTextById: Map<string, string>
): Map<string, VocabularyTranslation> {
    const parsed = JSON.parse(raw) as { translations?: unknown };
    if (!Array.isArray(parsed.translations)) {
        throw new InternalServerError("Invalid batch translation payload from AI");
    }

    const result = new Map<string, VocabularyTranslation>();
    for (const entry of parsed.translations) {
        if (typeof entry !== "object" || entry === null) {
            continue;
        }
        const record = entry as Record<string, unknown>;
        const vocabularyId = record.vocabulary_id;
        if (typeof vocabularyId !== "string" || !expectedIds.has(vocabularyId)) {
            continue;
        }

        const { vocabulary_id: _ignored, ...translationFields } = record;
        const translation = parseVocabularyTranslation(
            JSON.stringify(translationFields),
            fallbackTextById.get(vocabularyId)
        );
        result.set(vocabularyId, translation);
    }

    return result;
}

function parseVocabularyTranslation(raw: string, fallbackText?: string): VocabularyTranslation {
    const parsed = JSON.parse(raw) as Partial<VocabularyTranslation>;

    const normalized_text = parsed.normalized_text || fallbackText;

    if (
        typeof normalized_text !== "string" ||
        normalized_text.length === 0 ||
        typeof parsed.zh_translation !== "string" ||
        parsed.zh_translation.length === 0 ||
        typeof parsed.needs_language_review !== "boolean" ||
        typeof parsed.ipa_us !== "string" ||
        typeof parsed.syllables_en !== "string" ||
        parsed.syllables_en.length === 0 ||
        typeof parsed.syllables_ipa !== "string" ||
        typeof parsed.definition_simple !== "string" ||
        parsed.definition_simple.length === 0
    ) {
        throw new InternalServerError("Invalid translation payload from AI");
    }

    const ipa_us = stripIpaSlashes(parsed.ipa_us);
    const syllables_ipa = stripIpaSlashes(parsed.syllables_ipa);

    if (ipa_us.length === 0 || syllables_ipa.length === 0) {
        throw new InternalServerError("Invalid translation payload from AI");
    }

    return {
        normalized_text,
        zh_translation: parsed.zh_translation,
        needs_language_review: parsed.needs_language_review,
        ipa_us,
        syllables_en: parsed.syllables_en,
        syllables_ipa,
        definition_simple: parsed.definition_simple,
    };
}
