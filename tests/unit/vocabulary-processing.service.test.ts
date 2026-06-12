import type { TtsAudioResult } from "@api/services/tts.service";
import {
    chunkVocabularyIds,
    VocabularyProcessingService,
} from "@api/services/vocabulary-processing.service";
import { PLATFORM_ORGANIZATION_ID } from "@shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const VOCAB_AUDIO_TEST_ID = "vocab_1";

function makeTtsAudioFixture(vocabularyId: string): TtsAudioResult {
    const folder = `vocabulary/audio/${vocabularyId}`;
    return {
        enAudioUrl: "https://cdn.example.com/en.mp3",
        zhAudioUrl: "https://cdn.example.com/zh.mp3",
        enBucketKey: `${folder}/en.mp3`,
        zhBucketKey: `${folder}/zh.mp3`,
        enBytes: 100,
        zhBytes: 220,
    };
}

/** Aligns bucket keys with `TtsService` folder layout for {@link VOCAB_AUDIO_TEST_ID}. */
const TTS_FIX_DEFAULT = makeTtsAudioFixture(VOCAB_AUDIO_TEST_ID);

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
        deleteUploadedAudio: ReturnType<typeof vi.fn>;
    };
    let uploadRepo: {
        findUploadByBucketKey: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
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
            deleteUploadedAudio: vi.fn().mockResolvedValue(undefined),
        };
        uploadRepo = {
            findUploadByBucketKey: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
        };
    });

    const MOCK_SUCCESS_RESULT = {
        normalized_text: "hello",
        zh_translation: "你好",
        needs_language_review: false,
        ipa_us: "/hello/",
        syllables_en: "hel-lo",
        syllables_ipa: "/hel-lo/",
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
            maxTokens: 512,
            responseFormat: expect.any(Object),
        });
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");
        expect(vocabRepo.update).toHaveBeenCalledWith("vocab_1", {
            status: "text_ready",
            zhTranslation: "你好",
            pinyin: "nǐ hǎo",
            needsLanguageReview: false,
            ipaUs: "hello",
            syllablesEn: "hel-lo",
            syllablesIpa: "hel-lo",
            definitionSimple: "A greeting",
        });
        expect(vocabRepo.updateStatus).not.toHaveBeenCalledWith("vocab_1", "active");
        expect(ttsService.generateAndUpload).not.toHaveBeenCalled();
    });

    it("processText strips asymmetric IPA slashes on ipa_us and syllables_ipa", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify({
                ...MOCK_SUCCESS_RESULT,
                ipa_us: "/hello",
                syllables_ipa: "hel-lo/",
            }),
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

        expect(vocabRepo.update).toHaveBeenCalledWith(
            "vocab_1",
            expect.objectContaining({
                ipaUs: "hello",
                syllablesIpa: "hel-lo",
            })
        );
    });

    it("processText strips repeated leading/trailing IPA slashes in one pass", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "thunder",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify({
                ...MOCK_SUCCESS_RESULT,
                ipa_us: "//ˈθʌndər//",
                syllables_ipa: "///ˈθʌn-dər///",
            }),
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

        expect(vocabRepo.update).toHaveBeenCalledWith(
            "vocab_1",
            expect.objectContaining({
                ipaUs: "ˈθʌndər",
                syllablesIpa: "ˈθʌn-dər",
            })
        );
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

    it("processTextBatch uses one AI call for multiple phrases", async () => {
        vocabRepo.findById.mockImplementation(async (id: string) => {
            if (id === "vocab_1") {
                return { id: "vocab_1", text: "hello", status: "queued_text" };
            }
            if (id === "vocab_2") {
                return { id: "vocab_2", text: "world", status: "queued_text" };
            }
            return null;
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify({
                translations: [
                    { vocabulary_id: "vocab_1", ...MOCK_SUCCESS_RESULT },
                    {
                        vocabulary_id: "vocab_2",
                        normalized_text: "world",
                        zh_translation: "世界",
                        needs_language_review: false,
                        ipa_us: "wɜːld",
                        syllables_en: "world",
                        syllables_ipa: "wɜːld",
                        definition_simple: "The earth",
                    },
                ],
            }),
        });
        vocabRepo.update.mockResolvedValue({});
        vocabRepo.updateStatus.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            undefined
        );
        await service.processTextBatch(["vocab_1", "vocab_2"]);

        expect(aiService.generate).toHaveBeenCalledTimes(1);
        expect(aiService.generate).toHaveBeenCalledWith(
            expect.stringContaining('id="vocab_1"'),
            expect.objectContaining({ maxTokens: 1024 })
        );
        expect(vocabRepo.update).toHaveBeenCalledWith(
            "vocab_1",
            expect.objectContaining({ status: "text_ready" })
        );
        expect(vocabRepo.update).toHaveBeenCalledWith(
            "vocab_2",
            expect.objectContaining({ status: "text_ready" })
        );
    });

    it("processTextBatch delegates single-id batches to processText", async () => {
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
        await service.processTextBatch(["vocab_1"]);

        expect(aiService.generate).toHaveBeenCalledWith(
            expect.stringContaining("English phrase"),
            expect.objectContaining({ maxTokens: 512 })
        );
    });

    it("chunkVocabularyIds splits ids into fixed-size batches", () => {
        expect(chunkVocabularyIds(["a", "b", "c", "d", "e", "f"], 5)).toEqual([
            ["a", "b", "c", "d", "e"],
            ["f"],
        ]);
    });

    it("processAudio uploads audio and transitions text_ready -> active", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: "你好",
            status: "text_ready",
        });
        ttsService.generateAndUpload.mockResolvedValueOnce({ ...TTS_FIX_DEFAULT });

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            {
                logPipelineFailure: vi.fn(),
            }
        );
        await service.processAudio("vocab_1");

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("uploadRepo not configured"));
        warnSpy.mockRestore();

        expect(vocabRepo.updateStatus).toHaveBeenCalledTimes(1);
        expect(vocabRepo.updateStatus).toHaveBeenCalledWith("vocab_1", "processing_audio");
        expect(ttsService.generateAndUpload).toHaveBeenCalledWith("vocab_1", "hello", "你好");
        expect(vocabRepo.update).toHaveBeenCalledWith("vocab_1", {
            enAudioUrl: "https://cdn.example.com/en.mp3",
            zhAudioUrl: "https://cdn.example.com/zh.mp3",
            status: "active",
        });
        expect(uploadRepo.findUploadByBucketKey).not.toHaveBeenCalled();
        expect(uploadRepo.create).not.toHaveBeenCalled();
    });

    it("processAudio registers uploads when uploadRepo is provided", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: "你好",
            status: "text_ready",
        });
        ttsService.generateAndUpload.mockResolvedValueOnce({ ...TTS_FIX_DEFAULT });

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            { logPipelineFailure: vi.fn() },
            uploadRepo as never
        );
        await service.processAudio("vocab_1");

        expect(uploadRepo.findUploadByBucketKey).toHaveBeenCalledWith(
            "vocabulary/audio/vocab_1/en.mp3",
            PLATFORM_ORGANIZATION_ID
        );
        expect(uploadRepo.findUploadByBucketKey).toHaveBeenCalledWith(
            "vocabulary/audio/vocab_1/zh.mp3",
            PLATFORM_ORGANIZATION_ID
        );
        expect(uploadRepo.create).toHaveBeenCalledTimes(2);
        expect(uploadRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId: PLATFORM_ORGANIZATION_ID,
                uploadedBy: null,
                bucketKey: "vocabulary/audio/vocab_1/en.mp3",
                url: "https://cdn.example.com/en.mp3",
                originalName: "vocabulary-vocab_1-en.mp3",
                fileSize: TTS_FIX_DEFAULT.enBytes,
                contentType: "audio/mpeg",
                status: "completed",
            })
        );
        expect(uploadRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                bucketKey: "vocabulary/audio/vocab_1/zh.mp3",
                url: "https://cdn.example.com/zh.mp3",
                fileSize: TTS_FIX_DEFAULT.zhBytes,
            })
        );
    });

    it("processAudio skips upload create when records already exist", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            zhTranslation: "你好",
            status: "text_ready",
        });
        ttsService.generateAndUpload.mockResolvedValueOnce({ ...TTS_FIX_DEFAULT });
        uploadRepo.findUploadByBucketKey.mockResolvedValue({ id: "u1" });

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            { logPipelineFailure: vi.fn() },
            uploadRepo as never
        );
        await service.processAudio("vocab_1");

        expect(uploadRepo.create).not.toHaveBeenCalled();
    });

    it("processAudio deletes synthesized audio from storage when uploads registry insert fails", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: VOCAB_AUDIO_TEST_ID,
            text: "hello",
            zhTranslation: "你好",
            status: "text_ready",
        });
        const fixture = makeTtsAudioFixture(VOCAB_AUDIO_TEST_ID);
        ttsService.generateAndUpload.mockResolvedValueOnce(fixture);
        uploadRepo.create.mockRejectedValueOnce(new Error("insert failed"));

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            ttsService as never,
            { logPipelineFailure: vi.fn() },
            uploadRepo as never
        );

        await expect(service.processAudio(VOCAB_AUDIO_TEST_ID)).rejects.toThrow("insert failed");
        expect(ttsService.deleteUploadedAudio).toHaveBeenCalledWith(fixture);
        expect(vocabRepo.update).not.toHaveBeenCalled();
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
