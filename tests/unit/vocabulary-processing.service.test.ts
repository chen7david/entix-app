import { VocabularyProcessingService } from "@api/services/vocabulary-processing.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("VocabularyProcessingService", () => {
    let vocabRepo: {
        findById: ReturnType<typeof vi.fn>;
        updateStatus: ReturnType<typeof vi.fn>;
    };
    let aiService: {
        generate: ReturnType<typeof vi.fn>;
    };
    let queue: {
        send: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vocabRepo = {
            findById: vi.fn(),
            updateStatus: vi.fn(),
        };
        aiService = {
            generate: vi.fn(),
        };
        queue = {
            send: vi.fn(),
        };
    });

    it("processText transitions new -> processing_text -> text_ready and enqueues audio", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify({
                zh_translation: "ni hao",
                pinyin: "ni hao",
                needs_language_review: false,
            }),
        });
        vocabRepo.updateStatus.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            queue as never
        );
        await service.processText("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(2, "vocab_1", "text_ready", {
            zhTranslation: "ni hao",
            pinyin: "ni hao",
        });
        expect(queue.send).toHaveBeenCalledWith({
            type: "vocabulary.process-audio",
            vocabularyId: "vocab_1",
        });
    });

    it("processText sets review only when AI flags language quality (not on parse failure)", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({
            text: JSON.stringify({
                zh_translation: "x",
                pinyin: "x",
                needs_language_review: true,
            }),
        });
        vocabRepo.updateStatus.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as never,
            aiService as never,
            queue as never
        );
        await service.processText("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(2, "vocab_1", "review", {
            zhTranslation: "x",
            pinyin: "x",
        });
        expect(queue.send).not.toHaveBeenCalled();
    });

    it("processText keeps processing_text and logs pipeline failure on infra/parse errors (not review)", async () => {
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
            queue as never,
            {
                logPipelineFailure,
            }
        );

        await service.processText("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenCalledTimes(1);
        expect(vocabRepo.updateStatus).toHaveBeenNthCalledWith(1, "vocab_1", "processing_text");

        const reviewCalls = vocabRepo.updateStatus.mock.calls.filter((c) => c[1] === "review");
        expect(reviewCalls).toHaveLength(0);

        expect(logPipelineFailure).toHaveBeenCalledTimes(1);
        expect(logPipelineFailure).toHaveBeenCalledWith("text", "vocab_1", expect.any(Error));
    });
});
