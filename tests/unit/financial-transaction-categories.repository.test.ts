import { FinancialTransactionCategoriesRepository } from "@api/repositories/financial/financial-transaction-categories.repository";
import { generateCategoryId } from "@shared";
import { financialTransactionCategories } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../lib/utils";

describe("FinancialTransactionCategoriesRepository", () => {
    let db: TestDb;
    let repo: FinancialTransactionCategoriesRepository;

    const BASE_INPUT = {
        name: "Test Category",
        isExpense: true,
        isRevenue: false,
    };

    beforeEach(async () => {
        db = await createTestDb();
        repo = new FinancialTransactionCategoriesRepository(db);
        await db.delete(financialTransactionCategories);
    });

    describe("create", () => {
        it("creates a category when the service layer supplies a prefixed id", async () => {
            const id = generateCategoryId();
            const category = await repo.create(id, BASE_INPUT);
            if (!category) throw new Error("create failed");
            expect(category.id).toBe(id);
            expect(category.name).toBe("Test Category");
            expect(category.archivedAt).toBeNull();
        });

        it("throws on exclusive constraint violation (both true)", async () => {
            await expect(
                repo.create(generateCategoryId(), {
                    name: "Invalid",
                    isExpense: true,
                    isRevenue: true,
                })
            ).rejects.toThrow();
        });

        it("throws on duplicate name", async () => {
            const first = await repo.create(generateCategoryId(), BASE_INPUT);
            if (!first) throw new Error("create failed");
            await expect(repo.create(generateCategoryId(), BASE_INPUT)).rejects.toThrow();
        });
    });

    describe("findCategoryById", () => {
        it("returns category when found", async () => {
            const created = await repo.create(generateCategoryId(), BASE_INPUT);
            if (!created) throw new Error("create failed");
            const found = await repo.findCategoryById(created.id);
            expect(found?.id).toBe(created.id);
        });

        it("returns null when not found", async () => {
            const found = await repo.findCategoryById("fcat_ghost");
            expect(found).toBeNull();
        });
    });

    describe("findActive", () => {
        it("only returns non-archived categories", async () => {
            const active = await repo.create(generateCategoryId(), BASE_INPUT);
            if (!active) throw new Error("create failed");
            const archived = await repo.create(generateCategoryId(), {
                name: "Archived",
                isExpense: false,
                isRevenue: true,
            });
            if (!archived) throw new Error("create failed");
            await repo.archive(archived.id);

            const results = await repo.findActive();
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });
    });

    describe("archive", () => {
        it("sets archivedAt timestamp", async () => {
            const category = await repo.create(generateCategoryId(), BASE_INPUT);
            if (!category) throw new Error("create failed");
            const updated = await repo.archive(category.id);
            expect(updated?.archivedAt).toBeInstanceOf(Date);
        });

        it("returns null when category not found", async () => {
            const result = await repo.archive("fcat_ghost");
            expect(result).toBeNull();
        });
    });
});
