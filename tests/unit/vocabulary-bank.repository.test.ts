import { VocabularyBankRepository } from "@api/repositories/vocabulary-bank.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("VocabularyBankRepository", () => {
    let repo: VocabularyBankRepository;
    let db: any;
    let insertValues: ReturnType<typeof vi.fn>;
    let selectWhereLimit: ReturnType<typeof vi.fn>;
    let selectLimit: ReturnType<typeof vi.fn>;
    let updateSet: ReturnType<typeof vi.fn>;
    let updateWhereReturning: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        insertValues = vi.fn();
        selectWhereLimit = vi.fn();
        selectLimit = vi.fn();
        updateWhereReturning = vi.fn();
        updateSet = vi.fn(() => ({
            where: vi.fn(() => ({
                returning: updateWhereReturning,
            })),
        }));

        db = {
            insert: vi.fn(() => ({
                values: insertValues,
            })),
            select: vi.fn(() => ({
                from: vi.fn(() => ({
                    where: vi.fn(() => ({
                        limit: selectWhereLimit,
                    })),
                    limit: selectLimit,
                })),
            })),
            update: vi.fn(() => ({
                set: updateSet,
            })),
        };
        repo = new VocabularyBankRepository(db);
    });

    it("findOrCreate inserts a new row when text does not exist", async () => {
        const onConflictDoNothing = vi.fn(async () => {});
        insertValues.mockReturnValue({ onConflictDoNothing });
        selectWhereLimit.mockResolvedValue([{ id: "v_1", text: "hello", status: "new" }]);

        const item = await repo.findOrCreate("hello");
        expect(insertValues).toHaveBeenCalledWith({ text: "hello", status: "new" });
        expect(item.text).toBe("hello");
        expect(item.status).toBe("new");
    });

    it("findOrCreate returns existing row on duplicate normalized text", async () => {
        const onConflictDoNothing = vi.fn(async () => {});
        insertValues.mockReturnValue({ onConflictDoNothing });
        selectWhereLimit.mockResolvedValue([{ id: "v_existing", text: "hello", status: "active" }]);

        const second = await repo.findOrCreate(" Hello ");
        expect(insertValues).toHaveBeenCalledWith({ text: "hello", status: "new" });
        expect(second.id).toBe("v_existing");
        expect(second.text).toBe("hello");
    });

    it("updateStatus transitions state and updates updatedAt", async () => {
        updateWhereReturning.mockResolvedValue([
            { id: "v_1", status: "processing_text", updatedAt: new Date() },
        ]);
        const updated = await repo.updateStatus("v_1", "processing_text");

        expect(updated).not.toBeNull();
        expect(updated?.status).toBe("processing_text");
        expect(updateSet).toHaveBeenCalledWith(
            expect.objectContaining({ status: "processing_text", updatedAt: expect.any(Date) })
        );
    });

    it("getByStatus only returns rows in requested status", async () => {
        selectWhereLimit.mockResolvedValue([
            { id: "v_1", status: "review" },
            { id: "v_2", status: "review" },
        ]);

        const reviewItems = await repo.getByStatus("review");
        expect(selectWhereLimit).toHaveBeenCalledWith(50);
        expect(reviewItems.every((item) => item.status === "review")).toBe(true);
    });
});
