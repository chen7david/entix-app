import { StudentVocabularyRepository } from "@api/repositories/student-vocabulary.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("StudentVocabularyRepository", () => {
    let repo: StudentVocabularyRepository;
    let db: any;
    let insertReturning: ReturnType<typeof vi.fn>;
    let selectLimit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        insertReturning = vi.fn();
        selectLimit = vi.fn();

        db = {
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    returning: insertReturning,
                })),
            })),
            select: vi.fn(() => ({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: selectLimit,
                    })),
                })),
            })),
        };
        repo = new StudentVocabularyRepository(db as any);
    });

    it("add inserts and returns a new record", async () => {
        insertReturning.mockResolvedValueOnce([
            { id: "sv_1", userId: "student_1", vocabularyId: "vocab_1", attendanceId: "att_1" },
        ]);
        const record = await repo.add({
            userId: "student_1",
            orgId: "org_vocab",
            vocabularyId: "vocab_1",
            attendanceId: "att_1",
        });

        expect(record).not.toBeNull();
        expect(record?.userId).toBe("student_1");
        expect(record?.vocabularyId).toBe("vocab_1");
    });

    it("add returns null on unique collision", async () => {
        insertReturning.mockRejectedValueOnce(new Error("SQLITE_CONSTRAINT_UNIQUE"));

        const duplicate = await repo.add({
            userId: "student_1",
            orgId: "org_vocab",
            vocabularyId: "vocab_1",
            attendanceId: "att_1",
        });

        expect(duplicate).toBeNull();
    });

    it("add re-throws non-constraint database errors", async () => {
        insertReturning.mockRejectedValueOnce(new Error("DB connection lost"));
        await expect(
            repo.add({
                userId: "student_1",
                orgId: "org_vocab",
                vocabularyId: "vocab_1",
                attendanceId: "att_1",
            })
        ).rejects.toBeInstanceOf(Error);
    });

    it("addIfMissing inserts then returns existing row on repeated input", async () => {
        insertReturning.mockResolvedValueOnce([{ id: "sv_1" }]);
        insertReturning.mockRejectedValueOnce(new Error("UNIQUE constraint failed"));
        selectLimit.mockResolvedValueOnce([
            {
                id: "sv_1",
                userId: "student_1",
                vocabularyId: "vocab_1",
                attendanceId: "att_1",
            },
        ]);

        const first = await repo.addIfMissing({
            userId: "student_1",
            orgId: "org_vocab",
            vocabularyId: "vocab_1",
            attendanceId: "att_1",
        });
        const second = await repo.addIfMissing({
            userId: "student_1",
            orgId: "org_vocab",
            vocabularyId: "vocab_1",
            attendanceId: "att_1",
        });

        expect(second.id).toBe(first.id);
    });

    it("addIfMissing creates distinct rows for different attendees", async () => {
        insertReturning
            .mockResolvedValueOnce([
                { id: "sv_1", userId: "student_1", vocabularyId: "vocab_1", attendanceId: "att_1" },
            ])
            .mockResolvedValueOnce([
                { id: "sv_2", userId: "student_2", vocabularyId: "vocab_1", attendanceId: "att_2" },
            ]);

        const a = await repo.addIfMissing({
            userId: "student_1",
            orgId: "org_vocab",
            vocabularyId: "vocab_1",
            attendanceId: "att_1",
        });
        const b = await repo.addIfMissing({
            userId: "student_2",
            orgId: "org_vocab",
            vocabularyId: "vocab_1",
            attendanceId: "att_2",
        });

        expect(a.id).not.toBe(b.id);
    });
});
