import { ConflictError, NotFoundError } from "@api/errors/app.error";
import type { SessionAttendancesRepository } from "@api/repositories/schedule/session-attendances.repository";
import type { StudentVocabularyRepository } from "@api/repositories/vocabulary/student-vocabulary.repository";
import type { VocabularyBankRepository } from "@api/repositories/vocabulary/vocabulary-bank.repository";
import { VocabularyService } from "@api/services/vocabulary/vocabulary.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSessionAttendancesRepoMock } from "../mocks/session-attendances.repository.mock";
import { makeStudentVocabularyRepoMock } from "../mocks/student-vocabulary.repository.mock";
import { makeVocabularyBankRepoMock } from "../mocks/vocabulary-bank.repository.mock";

describe("VocabularyService", () => {
    let vocabularyRepo: ReturnType<typeof makeVocabularyBankRepoMock>;
    let attendancesRepo: ReturnType<typeof makeSessionAttendancesRepoMock>;
    let studentVocabRepo: ReturnType<typeof makeStudentVocabularyRepoMock>;
    let service: VocabularyService;

    beforeEach(() => {
        vi.resetAllMocks();
        vocabularyRepo = makeVocabularyBankRepoMock();
        attendancesRepo = makeSessionAttendancesRepoMock();
        studentVocabRepo = makeStudentVocabularyRepoMock();

        service = new VocabularyService(
            vocabularyRepo as unknown as VocabularyBankRepository,
            attendancesRepo as unknown as SessionAttendancesRepository,
            studentVocabRepo as unknown as StudentVocabularyRepository
        );
    });

    it("createVocabulary does not enqueue queue jobs (cron-driven pipeline)", async () => {
        vocabularyRepo.findOrCreate.mockResolvedValueOnce({
            ...makeVocabularyItem(),
            id: "vocab_1",
            status: "new",
        });

        await service.createVocabulary("org_1", { text: "hello" });
        vocabularyRepo.findOrCreate.mockResolvedValueOnce({
            ...makeVocabularyItem({ text: "stuck", status: "processing_text" }),
            id: "vocab_stuck",
            status: "processing_text",
        });

        await service.createVocabulary("org_1", { text: "stuck" });
        vocabularyRepo.findOrCreate.mockResolvedValueOnce({
            ...makeVocabularyItem({ text: "ready", status: "text_ready" }),
            id: "vocab_ready",
            status: "text_ready",
        });

        await service.createVocabulary("org_1", { text: "ready" });
        vocabularyRepo.findOrCreate.mockResolvedValueOnce({
            ...makeVocabularyItem({ text: "audio", status: "processing_audio" }),
            id: "vocab_audio",
            status: "processing_audio",
        });

        await service.createVocabulary("org_1", { text: "audio" });
        vocabularyRepo.findOrCreate.mockResolvedValueOnce({
            ...makeVocabularyItem({ text: "world" }),
            id: "vocab_2",
            status: "active",
        });

        await service.createVocabulary("org_1", { text: "world" });
    });

    it("createVocabulary with session fan-out treats addIfMissing null as idempotent", async () => {
        vocabularyRepo.findOrCreate.mockResolvedValue({
            ...makeVocabularyItem(),
            id: "vocab_1",
            status: "active",
        });
        attendancesRepo.getBySessionAndOrg.mockResolvedValue([
            makeAttendance({ id: "att_1", userId: "user_1" }),
            makeAttendance({ id: "att_2", userId: "user_2" }),
        ]);
        studentVocabRepo.addIfMissing
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(makeStudentVocab({ id: "sv_2" }));

        const result = await service.createVocabulary("org_1", {
            text: "hello",
            sessionId: "session_1",
        });

        expect(result.targetCount).toBe(2);
        expect(studentVocabRepo.addIfMissing).toHaveBeenCalledTimes(2);
    });

    it("assignVocabularyToStudent throws NotFoundError when vocabulary is missing", async () => {
        vocabularyRepo.findById.mockResolvedValue(null);

        await expect(
            service.assignVocabularyToStudent({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "missing",
                userId: "user_1",
                attendanceId: "att_1",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("assignVocabularyToStudent throws NotFoundError when attendance is missing", async () => {
        vocabularyRepo.findById.mockResolvedValue(makeVocabularyItem({ id: "vocab_1" }));
        attendancesRepo.findById.mockResolvedValue(null);

        await expect(
            service.assignVocabularyToStudent({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "vocab_1",
                userId: "user_1",
                attendanceId: "att_missing",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("assignVocabularyToStudent throws ConflictError on duplicate assignment", async () => {
        vocabularyRepo.findById.mockResolvedValue(makeVocabularyItem({ id: "vocab_1" }));
        attendancesRepo.findById.mockResolvedValue({
            ...makeAttendance(),
            id: "att_1",
        });
        studentVocabRepo.add.mockResolvedValue(null);

        await expect(
            service.assignVocabularyToStudent({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "vocab_1",
                userId: "user_1",
                attendanceId: "att_1",
            })
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("assignVocabularyToStudent throws NotFoundError when attendance belongs to another session", async () => {
        vocabularyRepo.findById.mockResolvedValue(makeVocabularyItem({ id: "vocab_1" }));
        attendancesRepo.findById.mockResolvedValue(
            makeAttendance({
                id: "att_1",
                sessionId: "session_other",
            })
        );

        await expect(
            service.assignVocabularyToStudent({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "vocab_1",
                userId: "user_1",
                attendanceId: "att_1",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("assignVocabularyToStudent throws NotFoundError when attendance belongs to another user", async () => {
        vocabularyRepo.findById.mockResolvedValue(makeVocabularyItem({ id: "vocab_1" }));
        attendancesRepo.findById.mockResolvedValue(
            makeAttendance({
                id: "att_1",
                userId: "user_other",
            })
        );

        await expect(
            service.assignVocabularyToStudent({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "vocab_1",
                userId: "user_1",
                attendanceId: "att_1",
            })
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("listReviewVocabulary returns paginated data via service processing", async () => {
        const now = new Date();
        vocabularyRepo.getReviewItems.mockResolvedValue([
            makeVocabularyItem({
                id: "v1",
                text: "a",
                status: "review",
                updatedAt: new Date(now.getTime() + 2),
            }),
            makeVocabularyItem({
                id: "v2",
                text: "b",
                status: "review",
                updatedAt: new Date(now.getTime() + 1),
            }),
            makeVocabularyItem({ id: "v3", text: "c", status: "review", updatedAt: now }),
        ]);

        const result = await service.listReviewVocabulary({ limit: 2, direction: "next" });

        expect(vocabularyRepo.getReviewItems).toHaveBeenCalledWith({
            limit: 3,
            direction: "next",
            cursorUpdatedAt: undefined,
            cursorId: undefined,
        });
        expect(result.items).toHaveLength(2);
        expect(result.nextCursor).not.toBeNull();
    });

    describe("removeSessionVocabulary", () => {
        it("successfully removes assignment", async () => {
            studentVocabRepo.removeById.mockResolvedValueOnce(true);

            await expect(
                service.removeSessionVocabulary({
                    organizationId: "org_1",
                    studentVocabId: "sv_1",
                })
            ).resolves.not.toThrow();

            expect(studentVocabRepo.removeById).toHaveBeenCalledWith("sv_1", "org_1");
        });

        it("throws NotFoundError when assignment does not exist", async () => {
            studentVocabRepo.removeById.mockResolvedValueOnce(false);

            await expect(
                service.removeSessionVocabulary({
                    organizationId: "org_1",
                    studentVocabId: "missing",
                })
            ).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("removeVocabularyFromSession", () => {
        it("successfully removes vocabulary for all students in session", async () => {
            attendancesRepo.getBySessionAndOrg.mockResolvedValueOnce([
                makeAttendance({ id: "att_1", userId: "u1" }),
                makeAttendance({ id: "att_2", userId: "u2" }),
            ]);
            studentVocabRepo.removeByVocabAndAttendances.mockResolvedValueOnce(2);

            await service.removeVocabularyFromSession({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "v1",
            });

            expect(attendancesRepo.getBySessionAndOrg).toHaveBeenCalledWith("org_1", "session_1");
            expect(studentVocabRepo.removeByVocabAndAttendances).toHaveBeenCalledWith(
                "org_1",
                "v1",
                ["att_1", "att_2"]
            );
        });

        it("does nothing if no attendances found", async () => {
            attendancesRepo.getBySessionAndOrg.mockResolvedValueOnce([]);

            await service.removeVocabularyFromSession({
                organizationId: "org_1",
                sessionId: "session_1",
                vocabId: "v1",
            });

            expect(studentVocabRepo.removeByVocabAndAttendances).not.toHaveBeenCalled();
        });
    });
});

function makeVocabularyItem(
    overrides: Partial<{
        id: string;
        text: string;
        status:
            | "new"
            | "queued_text"
            | "processing_text"
            | "text_ready"
            | "queued_audio"
            | "processing_audio"
            | "active"
            | "review";
        createdAt: Date;
        updatedAt: Date;
    }> = {}
) {
    return {
        id: overrides.id ?? "vocab_1",
        text: overrides.text ?? "hello",
        zhTranslation: null,
        pinyin: null,
        needsLanguageReview: null,
        ipaUs: null,
        syllablesEn: null,
        syllablesIpa: null,
        definitionSimple: null,
        enAudioUrl: null,
        zhAudioUrl: null,
        status: overrides.status ?? "new",
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

function makeAttendance(
    overrides: Partial<{
        id: string;
        userId: string;
        organizationId: string;
        sessionId: string;
    }> = {}
) {
    return {
        id: overrides.id ?? "att_1",
        userId: overrides.userId ?? "user_1",
        organizationId: overrides.organizationId ?? "org_1",
        sessionId: overrides.sessionId ?? "session_1",
        joinedAt: new Date(),
        absent: false,
        absenceReason: null,
        notes: null,
        paymentStatus: "unpaid" as const,
    };
}

function makeStudentVocab(overrides: Partial<{ id: string }> = {}) {
    return {
        id: overrides.id ?? "sv_1",
        userId: "user_1",
        organizationId: "org_1",
        vocabularyId: "vocab_1",
        attendanceId: "att_1",
        createdAt: new Date(),
    };
}
