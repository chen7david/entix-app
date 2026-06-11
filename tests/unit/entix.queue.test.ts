import { EntixQueueHandler } from "@api/queues/entix.queue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    processText: vi.fn(),
    processTextBatch: vi.fn(),
}));

vi.mock("drizzle-orm/d1", () => ({
    drizzle: vi.fn(() => ({})),
}));

vi.mock("@api/repositories/vocabulary-bank.repository", () => ({
    VocabularyBankRepository: class {},
}));

vi.mock("@api/repositories/system-audit.repository", () => ({
    SystemAuditRepository: class {
        insert = vi.fn();
    },
}));

vi.mock("@api/factories/ai.factory", () => ({
    createAiServiceFromEnv: vi.fn(() => ({
        generate: vi.fn(),
        getModel: () => "deepseek-v4-flash",
        getProvider: () => "deepseek",
    })),
}));

vi.mock("@api/services/vocabulary-processing.service", () => ({
    VOCABULARY_TRANSLATION_INSTRUCTIONS: "translate",
    VOCABULARY_TRANSLATION_BATCH_INSTRUCTIONS: "translate batch",
    VocabularyProcessingService: class {
        processText = mocks.processText;
        processTextBatch = mocks.processTextBatch;
        processAudio = vi.fn();
    },
}));

describe("EntixQueueHandler vocabulary.process-text", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("acks translation jobs even without GCP TTS secrets", async () => {
        mocks.processText.mockResolvedValue(undefined);
        const message = makeMessage("vocabulary.process-text", { vocabularyId: "vocab_1" });

        await EntixQueueHandler.process(
            message as never,
            {
                DB: {},
                DEEPSEEK_API_KEY: "sk-test",
                DEEPSEEK_MODEL: "deepseek-v4-flash",
            } as never,
            {} as never
        );

        expect(mocks.processText).toHaveBeenCalledWith("vocab_1");
        expect(message.ack).toHaveBeenCalledTimes(1);
        expect(message.retry).not.toHaveBeenCalled();
    });

    it("retries text job when translation processing throws", async () => {
        mocks.processText.mockRejectedValue(new Error("translation failed"));
        const message = makeMessage("vocabulary.process-text", { vocabularyId: "vocab_2" });

        await EntixQueueHandler.process(
            message as never,
            {
                DB: {},
                DEEPSEEK_API_KEY: "sk-test",
                DEEPSEEK_MODEL: "deepseek-v4-flash",
            } as never,
            {} as never
        );

        expect(message.retry).toHaveBeenCalledTimes(1);
        expect(message.ack).not.toHaveBeenCalled();
    });
});

describe("EntixQueueHandler vocabulary.process-text-batch", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("acks batch translation jobs on success", async () => {
        mocks.processTextBatch.mockResolvedValue(undefined);
        const message = makeBatchMessage(["vocab_1", "vocab_2"]);

        await EntixQueueHandler.process(
            message as never,
            {
                DB: {},
                DEEPSEEK_API_KEY: "sk-test",
                DEEPSEEK_MODEL: "deepseek-v4-flash",
            } as never,
            {} as never
        );

        expect(mocks.processTextBatch).toHaveBeenCalledWith(["vocab_1", "vocab_2"]);
        expect(message.ack).toHaveBeenCalledTimes(1);
        expect(message.retry).not.toHaveBeenCalled();
    });

    it("retries batch text job when processing throws", async () => {
        mocks.processTextBatch.mockRejectedValue(new Error("batch failed"));
        const message = makeBatchMessage(["vocab_3"]);

        await EntixQueueHandler.process(
            message as never,
            {
                DB: {},
                DEEPSEEK_API_KEY: "sk-test",
                DEEPSEEK_MODEL: "deepseek-v4-flash",
            } as never,
            {} as never
        );

        expect(message.retry).toHaveBeenCalledTimes(1);
        expect(message.ack).not.toHaveBeenCalled();
    });
});

function makeMessage(type: "vocabulary.process-text", payload: { vocabularyId: string }) {
    return {
        body: {
            type,
            ...payload,
        },
        ack: vi.fn(),
        retry: vi.fn(),
    };
}

function makeBatchMessage(vocabularyIds: string[]) {
    return {
        body: {
            type: "vocabulary.process-text-batch" as const,
            vocabularyIds,
        },
        ack: vi.fn(),
        retry: vi.fn(),
    };
}
