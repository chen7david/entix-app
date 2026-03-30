import { FinancialTransactionCategoriesRepository } from "@api/repositories/financial/financial-transaction-categories.repository";
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
        it("creates a category with a generated ID", async () => {
            const category = await repo.create(BASE_INPUT);
            expect(category.id).toMatch(/^fcat_/);
            expect(category.name).toBe("Test Category");
            expect(category.archivedAt).toBeNull();
        });

        it("throws on exclusive constraint violation (both true)", async () => {
            await expect(
                repo.create({ name: "Invalid", isExpense: true, isRevenue: true })
            ).rejects.toThrow();
        });

        it("throws on duplicate name", async () => {
            await repo.create(BASE_INPUT);
            await expect(repo.create(BASE_INPUT)).rejects.toThrow();
        });
    });

    describe("findById", () => {
        it("returns category when found", async () => {
            const created = await repo.create(BASE_INPUT);
            const found = await repo.findById(created.id);
            expect(found?.id).toBe(created.id);
        });

        it("returns null when not found", async () => {
            const found = await repo.findById("fcat_ghost");
            expect(found).toBeNull();
        });
    });

    describe("findActive", () => {
        it("only returns non-archived categories", async () => {
            const active = await repo.create(BASE_INPUT);
            const archived = await repo.create({
                name: "Archived",
                isExpense: false,
                isRevenue: true,
            });
            await repo.archive(archived.id);

            const results = await repo.findActive();
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });
    });

    describe("archive", () => {
        it("sets archivedAt timestamp", async () => {
            const category = await repo.create(BASE_INPUT);
            const updated = await repo.archive(category.id);
            expect(updated?.archivedAt).toBeInstanceOf(Date);
        });

        it("returns null when category not found", async () => {
            const result = await repo.archive("fcat_ghost");
            expect(result).toBeNull();
        });
    });
});
