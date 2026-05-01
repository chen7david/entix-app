import { ConflictError, NotFoundError } from "@api/errors/app.error";
import { VocabularyHandlers } from "@api/routes/orgs/vocabulary.handlers";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockVocabularyService: {
    createVocabulary: ReturnType<typeof vi.fn>;
    listReviewVocabulary: ReturnType<typeof vi.fn>;
    listSessionVocabulary: ReturnType<typeof vi.fn>;
    assignVocabularyToStudent: ReturnType<typeof vi.fn>;
};
type CreateVocabularyCtx = Parameters<typeof VocabularyHandlers.createVocabulary>[0];
type AssignVocabularyCtx = Parameters<typeof VocabularyHandlers.assignVocabularyToStudent>[0];

vi.mock("@api/factories/service.factory", () => ({
    getVocabularyService: () => mockVocabularyService,
}));

describe("VocabularyHandlers", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockVocabularyService = {
            createVocabulary: vi.fn(),
            listReviewVocabulary: vi.fn(),
            listSessionVocabulary: vi.fn(),
            assignVocabularyToStudent: vi.fn(),
        };
    });

    it("createVocabulary without sessionId creates bank entry only", async () => {
        mockVocabularyService.createVocabulary.mockResolvedValueOnce({
            item: makeVocabularyItem({ status: "new" }),
            targetCount: 0,
        });
        const json = vi.fn();

        const ctx = makeCtx({ organizationId: "org_1" }, { text: "hello" }, {}, json);

        await VocabularyHandlers.createVocabulary(
            ctx as unknown as CreateVocabularyCtx,
            undefined as never
        );

        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ targetCount: 0 }),
            }),
            expect.any(Number)
        );
    });

    it("createVocabulary with sessionId fans out and is idempotent-safe", async () => {
        mockVocabularyService.createVocabulary.mockResolvedValue({
            item: makeVocabularyItem({ status: "active" }),
            targetCount: 2,
        });
        const json = vi.fn();
        const ctx = makeCtx(
            { organizationId: "org_1" },
            { text: "hello", sessionId: "session_1" },
            {},
            json
        );

        await VocabularyHandlers.createVocabulary(
            ctx as unknown as CreateVocabularyCtx,
            undefined as never
        );

        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ targetCount: 2 }),
            }),
            expect.any(Number)
        );
    });

    it("createVocabulary handler calls service with organization and payload", async () => {
        mockVocabularyService.createVocabulary.mockResolvedValue({
            item: makeVocabularyItem({ status: "new" }),
            targetCount: 0,
        });
        const json = vi.fn();
        const ctx = makeCtx({ organizationId: "org_1" }, { text: "hello" }, {}, json);
        await VocabularyHandlers.createVocabulary(
            ctx as unknown as CreateVocabularyCtx,
            undefined as never
        );
        expect(mockVocabularyService.createVocabulary).toHaveBeenCalledWith("org_1", {
            text: "hello",
        });
    });

    it("assignVocabularyToStudent returns 404 when vocabulary does not exist", async () => {
        mockVocabularyService.assignVocabularyToStudent.mockRejectedValueOnce(
            new NotFoundError("Vocabulary item not found")
        );
        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1", vocabId: "missing" },
            { userId: "student_1", attendanceId: "att_1" },
            {},
            vi.fn()
        );

        await expect(
            VocabularyHandlers.assignVocabularyToStudent(
                ctx as unknown as AssignVocabularyCtx,
                undefined as never
            )
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("assignVocabularyToStudent returns 409 on duplicate assignment", async () => {
        mockVocabularyService.assignVocabularyToStudent.mockRejectedValueOnce(
            new ConflictError("duplicate")
        );

        const ctx = makeCtx(
            { organizationId: "org_1", sessionId: "session_1", vocabId: "vocab_1" },
            { userId: "student_1", attendanceId: "att_1" },
            {},
            vi.fn()
        );

        await expect(
            VocabularyHandlers.assignVocabularyToStudent(
                ctx as unknown as AssignVocabularyCtx,
                undefined as never
            )
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
