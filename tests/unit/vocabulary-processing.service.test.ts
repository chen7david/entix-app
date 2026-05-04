import { VocabularyProcessingService } from "@api/services/vocabulary-processing.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("VocabularyProcessingService", () => {
    let vocabRepo: {
        findById: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        updateStatus: ReturnType<typeof vi.fn>;
    };
    let aiService: {
        generate: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vocabRepo = {
            findById: vi.fn(),
            update: vi.fn(),
            updateStatus: vi.fn(),
        };
        aiService = {
            generate: vi.fn(),
        };
    });

    const MOCK_SUCCESS_RESULT = {
        zh_translation: "ni hao",
        pinyin: "ni hao",
        needs_language_review: false,
        ipa_us: "/hello/",
        syllables_en: "hel-lo",
        syllables_ipa: "hel-lo",
        definition_simple: "A greeting",
    };

    it("processText transitions new -> text_ready -> active in text-only mode", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify(MOCK_SUCCESS_RESULT),
        });
        vocabRepo.update.mockResolvedValue({});
        vocabRepo.updateStatus.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            undefined
        );
        await service.processText("vocab_1");

        expect(aiService.generate).toHaveBeenCalledWith(expect.stringContaining("English phrase"), {
            temperature: 0.1,
            maxTokens: 1024,
            responseFormat: expect.any(Object),
        });
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");
        expect(vocabRepo.update).toHaveBeenCalledWith("vocab_1", {
            status: "text_ready",
            zhTranslation: "ni hao",
            pinyin: "ni hao",
            needsLanguageReview: false,
            ipaUs: "/hello/",
            syllablesEn: "hel-lo",
            syllablesIpa: "hel-lo",
            definitionSimple: "A greeting",
        });
        expect(vocabRepo.updateStatus).toHaveBeenLastCalledWith("vocab_1", "active");
    });

    it("processText sets review only when AI flags language quality", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify({
                ...MOCK_SUCCESS_RESULT,
                needs_language_review: true,
            }),
        });
        vocabRepo.update.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            undefined
        );
        await service.processText("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");
        expect(vocabRepo.update).toHaveBeenCalledWith(
            "vocab_1",
            expect.objectContaining({
                status: "review",
                needsLanguageReview: true,
            })
        );
        expect(vocabRepo.updateStatus).not.toHaveBeenCalledWith("vocab_1", "active");
    });

    it("processText leaves processing_text, logs pipeline failure, and rethrows on parse errors", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({ text: "not-json" });

        const logPipelineFailure = vi.fn();

        const service = new VocabularyProcessingService(vocabRepo as never, aiService as never, {
            logPipelineFailure,
        });

        await expect(service.processText("vocab_1")).rejects.toBeInstanceOf(Error);

        expect(vocabRepo.updateStatus).toHaveBeenCalledTimes(1);
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");

        expect(vocabRepo.update).not.toHaveBeenCalled();
        expect(logPipelineFailure).toHaveBeenCalledTimes(1);
    });

    it("processAudio transitions text_ready items directly to active while TTS is unavailable", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: "ni hao",
            status: "text_ready",
        });

        const service = new VocabularyProcessingService(vocabRepo as never, aiService as never, {
            logPipelineFailure: vi.fn(),
        });
        await service.processAudio("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenCalledTimes(1);
        expect(vocabRepo.updateStatus).toHaveBeenCalledWith("vocab_1", "active");
    });
});
