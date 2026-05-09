import { VocabularyProcessingService } from "@api/services/vocabulary-processing.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("VocabularyProcessingService", () => {
    let vocabRepo: {
        findById: ReturnType<typeof vi.fn>;
        findByText: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        updateStatus: ReturnType<typeof vi.fn>;
    };
    let aiService: {
        generate: ReturnType<typeof vi.fn>;
    };
    let ttsService: {
        generateAndUpload: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vocabRepo = {
            findById: vi.fn(),
            findByText: vi.fn(),
            update: vi.fn(),
            updateStatus: vi.fn(),
        };
        aiService = {
            generate: vi.fn(),
        };
        ttsService = {
            generateAndUpload: vi.fn(),
        };
    });

    const MOCK_SUCCESS_RESULT = {
        normalized_text: "hello",
        zh_translation: "你好",
        needs_language_review: false,
        ipa_us: "/hello/",
        syllables_en: "hel-lo",
        syllables_ipa: "hel-lo",
        definition_simple: "A greeting",
    };

    it("processText transitions new -> text_ready", async () => {
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
            ttsService as never,
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
            zhTranslation: "你好",
            pinyin: "nǐ hǎo",
            needsLanguageReview: false,
            ipaUs: "/hello/",
            syllablesEn: "hel-lo",
            syllablesIpa: "hel-lo",
            definitionSimple: "A greeting",
        });
        expect(vocabRepo.updateStatus).not.toHaveBeenCalledWith("vocab_1", "active");
        expect(ttsService.generateAndUpload).not.toHaveBeenCalled();
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
            ttsService as never,
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
        expect(ttsService.generateAndUpload).not.toHaveBeenCalled();
    });

    it("processText leaves processing_text, logs pipeline failure, and rethrows on parse errors", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({ text: "not-json" });

        const logPipelineFailure = vi.fn();

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            {
                logPipelineFailure,
            }
        );

        await expect(service.processText("vocab_1")).rejects.toBeInstanceOf(Error);

        expect(vocabRepo.updateStatus).toHaveBeenCalledTimes(1);
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");

        expect(vocabRepo.update).not.toHaveBeenCalled();
        expect(logPipelineFailure).toHaveBeenCalledTimes(1);
        expect(ttsService.generateAndUpload).not.toHaveBeenCalled();
    });

    it("processAudio uploads audio and transitions text_ready -> active", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: "你好",
            status: "text_ready",
        });
        ttsService.generateAndUpload.mockResolvedValueOnce({
            enAudioUrl: "https://cdn.example.com/en.mp3",
            zhAudioUrl: "https://cdn.example.com/zh.mp3",
        });

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            {
                logPipelineFailure: vi.fn(),
            }
        );
        await service.processAudio("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenCalledTimes(1);
        expect(vocabRepo.updateStatus).toHaveBeenCalledWith("vocab_1", "processing_audio");
        expect(ttsService.generateAndUpload).toHaveBeenCalledWith("vocab_1", "hello", "你好");
        expect(vocabRepo.update).toHaveBeenCalledWith("vocab_1", {
            enAudioUrl: "https://cdn.example.com/en.mp3",
            zhAudioUrl: "https://cdn.example.com/zh.mp3",
            status: "active",
        });
    });

    it("processAudio logs pipeline failure and rethrows when TTS upload fails", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: "你好",
            status: "text_ready",
        });
        const ttsError = new Error("tts failed");
        ttsService.generateAndUpload.mockRejectedValueOnce(ttsError);
        const logPipelineFailure = vi.fn();

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            {
                logPipelineFailure,
            }
        );

        await expect(service.processAudio("vocab_1")).rejects.toThrow("tts failed");
        expect(vocabRepo.updateStatus).toHaveBeenCalledWith("vocab_1", "processing_audio");
        expect(logPipelineFailure).toHaveBeenCalledWith("audio", "vocab_1", ttsError);
        expect(vocabRepo.update).not.toHaveBeenCalled();
    });

    it("processAudio throws when zhTranslation is missing", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: null,
            status: "text_ready",
        });

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            undefined
        );

        await expect(service.processAudio("vocab_1")).rejects.toThrow(
            "Cannot process audio: zhTranslation is missing"
        );
        expect(ttsService.generateAndUpload).not.toHaveBeenCalled();
    });

    it("processAudio throws when text is missing", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "",
            zhTranslation: "你好",
            status: "text_ready",
        });

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            undefined
        );

        await expect(service.processAudio("vocab_1")).rejects.toThrow(
            "Cannot process audio: text is missing or empty"
        );
        expect(ttsService.generateAndUpload).not.toHaveBeenCalled();
    });
});
