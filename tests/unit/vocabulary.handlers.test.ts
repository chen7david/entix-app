import { ConflictError, NotFoundError } from "@api/errors/app.error";
import { VocabularyHandlers } from "@api/routes/orgs/vocabulary.handlers";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockVocabularyRepo: {
    findOrCreate: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
};

let mockAttendancesRepo: {
    getBySessionAndOrg: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
};

let mockStudentVocabRepo: {
    addIfMissing: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
};

vi.mock("@api/factories/repository.factory", () => ({
    getVocabularyBankRepository: () => mockVocabularyRepo,
    getSessionAttendancesRepository: () => mockAttendancesRepo,
    getStudentVocabularyRepository: () => mockStudentVocabRepo,
}));

describe("VocabularyHandlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVocabularyRepo = {
            findOrCreate: vi.fn(),
            findById: vi.fn(),
        };
        mockAttendancesRepo = {
            getBySessionAndOrg: vi.fn(),
            findById: vi.fn(),
        };
        mockStudentVocabRepo = {
            addIfMissing: vi.fn(),
            add: vi.fn(),
        };
    });

    it("createVocabulary without sessionId creates bank entry only", async () => {
        mockVocabularyRepo.findOrCreate.mockResolvedValueOnce(
            makeVocabularyItem({ status: "new" })
        );
        const send = vi.fn();
        const json = vi.fn();

        const ctx = makeCtx(
            { organizationId: "org_1" },
            { text: "hello" },
            { QUEUE: { send } },
            json
        );

        await VocabularyHandlers.createVocabulary(ctx as any, undefined as never);

        expect(mockAttendancesRepo.getBySessionAndOrg).not.toHaveBeenCalled();
        expect(mockStudentVocabRepo.addIfMissing).not.toHaveBeenCalled();
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ assignedCount: 0 }),
            expect.any(Number)
        );
    });

    it("createVocabulary with sessionId fans out and is idempotent-safe", async () => {
        mockVocabularyRepo.findOrCreate.mockResolvedValue(makeVocabularyItem({ status: "active" }));
        mockAttendancesRepo.getBySessionAndOrg.mockResolvedValue([
            { id: "att_1", userId: "student_1" },
            { id: "att_2", userId: "student_2" },
        ]);
        mockStudentVocabRepo.addIfMissing.mockResolvedValue({ id: "sv_1" });

        const send = vi.fn();
        const json = vi.fn();
        const ctx = makeCtx(
            { organizationId: "org_1" },
            { text: "hello", sessionId: "session_1" },
            { QUEUE: { send } },
            json
        );

        await VocabularyHandlers.createVocabulary(ctx as any, undefined as never);

        expect(mockAttendancesRepo.getBySessionAndOrg).toHaveBeenCalledWith("org_1", "session_1");
        expect(mockStudentVocabRepo.addIfMissing).toHaveBeenCalledTimes(2);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({ assignedCount: 2 }),
            expect.any(Number)
        );
        expect(send).not.toHaveBeenCalled();
    });

    it("createVocabulary enqueues process-text only when status is new", async () => {
        const send = vi.fn();
        const json = vi.fn();
        const ctx = makeCtx(
            { organizationId: "org_1" },
            { text: "hello" },
            { QUEUE: { send } },
            json
        );

        mockVocabularyRepo.findOrCreate.mockResolvedValueOnce(
            makeVocabularyItem({ status: "new" })
        );
        await VocabularyHandlers.createVocabulary(ctx as any, undefined as never);
        expect(send).toHaveBeenCalledWith({
            type: "vocabulary.process-text",
            vocabularyId: "vocab_1",
        });

        send.mockClear();
        mockVocabularyRepo.findOrCreate.mockResolvedValueOnce(
            makeVocabularyItem({ status: "active" })
        );
        await VocabularyHandlers.createVocabulary(ctx as any, undefined as never);
        expect(send).not.toHaveBeenCalled();
    });

    it("assignVocabularyToStudent returns 404 when vocabulary does not exist", async () => {
        mockVocabularyRepo.findById.mockResolvedValueOnce(null);
        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1", vocabId: "missing" },
            { userId: "student_1", attendanceId: "att_1" },
            {},
            vi.fn()
        );

        await expect(
            VocabularyHandlers.assignVocabularyToStudent(ctx as any, undefined as never)
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("assignVocabularyToStudent returns 409 on duplicate assignment", async () => {
        mockVocabularyRepo.findById.mockResolvedValueOnce(makeVocabularyItem());
        mockAttendancesRepo.findById.mockResolvedValueOnce({
            id: "att_1",
            sessionId: "session_1",
            userId: "student_1",
        });
        mockStudentVocabRepo.add.mockResolvedValueOnce(null);

        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1", vocabId: "vocab_1" },
            { userId: "student_1", attendanceId: "att_1" },
            {},
            vi.fn()
        );

        await expect(
            VocabularyHandlers.assignVocabularyToStudent(ctx as any, undefined as never)
        ).rejects.toBeInstanceOf(ConflictError);
    });
});

function makeCtx(params: unknown, body: unknown, env: unknown, json: ReturnType<typeof vi.fn>) {
    return {
        req: {
            valid: (source: "param" | "json") => (source === "param" ? params : body),
        },
        env,
        json,
    };
}

function makeVocabularyItem(overrides?: Partial<{ id: string; status: string }>) {
    return {
        id: overrides?.id ?? "vocab_1",
        text: "hello",
        zhTranslation: null,
        pinyin: null,
        enAudioUrl: null,
        zhAudioUrl: null,
        status: (overrides?.status ?? "new") as
            | "new"
            | "processing_text"
            | "text_ready"
            | "processing_audio"
            | "active"
            | "review",
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
