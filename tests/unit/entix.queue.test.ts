import { TooManyRequestsError } from "@api/errors/app.error";
import { EntixQueueHandler } from "@api/queues/entix.queue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    processText: vi.fn(),
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

vi.mock("@api/services/ai.service", () => ({
    AiService: class {},
}));

vi.mock("@api/services/vocabulary-processing.service", () => ({
    VOCABULARY_TRANSLATION_INSTRUCTIONS: "translate",
    VocabularyProcessingService: class {
        processText = mocks.processText;
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

        await EntixQueueHandler.process(message as never, { DB: {} } as never, {} as never);

        expect(mocks.processText).toHaveBeenCalledWith("vocab_1");
        expect(message.ack).toHaveBeenCalledTimes(1);
        expect(message.retry).not.toHaveBeenCalled();
    });

    it("retries text job when translation processing throws", async () => {
        mocks.processText.mockRejectedValue(new Error("translation failed"));
        const message = makeMessage("vocabulary.process-text", { vocabularyId: "vocab_2" });

        await EntixQueueHandler.process(message as never, { DB: {} } as never, {} as never);

        expect(message.retry).toHaveBeenCalledTimes(1);
        expect(message.ack).not.toHaveBeenCalled();
    });

    it("defers text job when Gemini RPM limit is exceeded", async () => {
        mocks.processText.mockRejectedValue(
            new TooManyRequestsError("Gemini rate limit", {
                retryAfterMs: 12_000,
                source: "gemini_rate_limiter",
            })
        );
        const message = makeMessage("vocabulary.process-text", { vocabularyId: "vocab_3" });

        await EntixQueueHandler.process(message as never, { DB: {} } as never, {} as never);

        expect(message.retry).toHaveBeenCalledWith({ delaySeconds: 12 });
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
