import { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import { financialCurrencies } from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../lib/utils";

describe("FinancialCurrenciesRepository", () => {
    let db: TestDb;
    let repo: FinancialCurrenciesRepository;

    const BASE_INPUT = {
        code: "TST",
        name: "Test Currency",
        symbol: "T$",
    };

    beforeEach(async () => {
        db = await createTestDb();
        repo = new FinancialCurrenciesRepository(db);
        await db.delete(financialCurrencies);
    });

    describe("create", () => {
        it("creates a currency with a generated ID", async () => {
            const currency = await repo.create(BASE_INPUT);
            expect(currency.id).toMatch(/^fcur_/);
            expect(currency.code).toBe("TST");
            expect(currency.archivedAt).toBeNull();
        });

        it("throws on duplicate code (DB constraint)", async () => {
            await repo.create(BASE_INPUT);
            await expect(repo.create(BASE_INPUT)).rejects.toThrow();
        });
    });

    describe("findCurrencyById", () => {
        it("returns currency when found", async () => {
            const created = await repo.create(BASE_INPUT);
            const found = await repo.findCurrencyById(created.id);
            expect(found?.id).toBe(created.id);
        });

        it("returns null when not found", async () => {
            const found = await repo.findCurrencyById("fcur_ghost");
            expect(found).toBeNull();
        });
    });

    describe("findByCode", () => {
        it("returns currency when found (case-insensitive)", async () => {
            await repo.create(BASE_INPUT);
            const found = await repo.findByCode("tst");
            expect(found?.code).toBe("TST");
        });

        it("returns null when not found", async () => {
            const found = await repo.findByCode("GPB");
            expect(found).toBeNull();
        });
    });

    describe("findActive", () => {
        it("only returns non-archived currencies", async () => {
            const active = await repo.create(BASE_INPUT);
            const archived = await repo.create({ code: "ARC", name: "Archived", symbol: "A" });
            await repo.archive(archived.id);

            const results = await repo.findActive();
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });
    });

    describe("archive", () => {
        it("sets archivedAt timestamp", async () => {
            const currency = await repo.create(BASE_INPUT);
            const updated = await repo.archive(currency.id);
            expect(updated?.archivedAt).toBeInstanceOf(Date);
        });

        it("returns null when currency not found", async () => {
            const result = await repo.archive("fcur_ghost");
            expect(result).toBeNull();
        });
    });
});
