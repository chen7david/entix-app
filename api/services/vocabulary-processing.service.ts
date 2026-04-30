import type { EntixQueueMessage } from "@api/queues/entix.queue";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import type { AiService } from "./ai.service";

type VocabularyTranslation = {
    zh_translation: string;
    pinyin: string;
    needs_language_review?: boolean;
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
        private readonly queue: Queue<EntixQueueMessage>,
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
                "Translate the following English phrase to Mandarin Chinese.",
                "Return strict JSON only with keys: zh_translation, pinyin, needs_language_review.",
                "needs_language_review must be true only if the English phrase is likely misspelled, ungrammatical, or not sensible as study vocabulary.",
                "If needs_language_review is true, still output your best-effort zh_translation and pinyin if possible.",
                `English phrase: "${item.text}"`,
            ].join("\n");

            const result = await this.aiService.generate(prompt, {
                temperature: 0.1,
                maxTokens: 256,
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

            await this.queue.send({
                type: "vocabulary.process-audio",
                vocabularyId,
            });
        } catch (error: unknown) {
            await this.deps?.logPipelineFailure("text", vocabularyId, error);
            // Leave status as processing_text for cron/queue retry; do not use `review`.
        }
    }

    async processAudio(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || (item.status !== "text_ready" && item.status !== "processing_audio")) {
            return;
        }

        await this.vocabRepo.updateStatus(vocabularyId, "processing_audio");

        try {
            const enAudioUrl = await this.generateTts(item.text, "en");
            const zhAudioUrl = await this.generateTts(item.zhTranslation ?? item.text, "zh");

            await this.vocabRepo.updateStatus(vocabularyId, "active", {
                enAudioUrl,
                zhAudioUrl,
            });
        } catch (error: unknown) {
            await this.deps?.logPipelineFailure("audio", vocabularyId, error);
            // Leave status as processing_audio for cron/queue retry; do not use `review`.
        }
    }

    private async generateTts(_text: string, _lang: "en" | "zh"): Promise<string> {
        throw new Error("TTS provider not implemented");
    }
}

function parseVocabularyTranslation(
    raw: string
): VocabularyTranslation & { needs_language_review: boolean } {
    const trimmed = raw.trim();

    const objectCandidate = trimmed.startsWith("{")
        ? trimmed
        : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);

    const parsed = JSON.parse(objectCandidate) as Partial<VocabularyTranslation> & {
        needs_language_review?: boolean;
    };
    const nlr = parsed.needs_language_review as boolean | string | undefined;
    const needs_language_review = nlr === true || nlr === "true";

    if (
        typeof parsed.zh_translation !== "string" ||
        parsed.zh_translation.length === 0 ||
        typeof parsed.pinyin !== "string" ||
        parsed.pinyin.length === 0
    ) {
        throw new Error("Invalid translation payload from AI");
    }

    return {
        zh_translation: parsed.zh_translation,
        pinyin: parsed.pinyin,
        needs_language_review,
    };
}
