import type { EntixQueueMessage } from "@api/queues/entix.queue";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import type { AiService } from "./ai.service";

type VocabularyTranslation = {
    zh_translation: string;
    pinyin: string;
};

export class VocabularyProcessingService {
    constructor(
        private readonly vocabRepo: VocabularyBankRepository,
        private readonly aiService: AiService,
        private readonly queue: Queue<EntixQueueMessage>
    ) {}

    async processText(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || item.status !== "new") {
            return;
        }

        await this.vocabRepo.updateStatus(vocabularyId, "processing_text");

        try {
            const prompt = [
                "Translate the following English phrase to Mandarin Chinese.",
                "Return strict JSON only with keys: zh_translation, pinyin.",
                `English phrase: "${item.text}"`,
            ].join("\n");

            const result = await this.aiService.generate(prompt, {
                temperature: 0.1,
                maxTokens: 256,
            });

            const parsed = parseVocabularyTranslation(result.text);
            await this.vocabRepo.updateStatus(vocabularyId, "text_ready", {
                zhTranslation: parsed.zh_translation,
                pinyin: parsed.pinyin,
            });

            await this.queue.send({
                type: "vocabulary.process-audio",
                vocabularyId,
            });
        } catch {
            await this.vocabRepo.updateStatus(vocabularyId, "review");
        }
    }

    async processAudio(vocabularyId: string): Promise<void> {
        const item = await this.vocabRepo.findById(vocabularyId);
        if (!item || item.status !== "text_ready") {
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
        } catch {
            await this.vocabRepo.updateStatus(vocabularyId, "review");
        }
    }

    private async generateTts(_text: string, _lang: "en" | "zh"): Promise<string> {
        throw new Error("TTS provider not implemented");
    }
}

function parseVocabularyTranslation(raw: string): VocabularyTranslation {
    const trimmed = raw.trim();

    const objectCandidate = trimmed.startsWith("{")
        ? trimmed
        : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);

    const parsed = JSON.parse(objectCandidate) as Partial<VocabularyTranslation>;
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
    };
}
