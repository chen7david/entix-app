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
            text: JSON.stringify({ zh_translation: "ni hao", pinyin: "ni hao" }),
        });
        vocabRepo.updateStatus.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as any,
            aiService as any,
            queue as any
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

    it("processText moves to review on parse failure", async () => {
        vocabRepo.findById.mockResolvedValueOnce({
            id: "vocab_1",
            text: "hello",
            status: "new",
        });
        aiService.generate.mockResolvedValueOnce({ text: "not-json" });
        vocabRepo.updateStatus.mockResolvedValue({});

        const service = new VocabularyProcessingService(
            vocabRepo as any,
            aiService as any,
            queue as any
        );
        await service.processText("vocab_1");

        expect(vocabRepo.updateStatus).toHaveBeenLastCalledWith("vocab_1", "review");
    });
});
