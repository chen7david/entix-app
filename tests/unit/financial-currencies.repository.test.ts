import { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import {
    financialAccounts,
    financialCurrencies,
    financialTransactionLines,
    financialTransactions,
} from "@shared/db/schema";
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

        // Delete in full dependency order to avoid FK constraint failures
        await db.delete(financialTransactionLines);
        await db.delete(financialTransactions);
        await db.delete(financialAccounts);
        await db.delete(financialCurrencies);
    });

    describe("insert", () => {
        it("creates a currency with a generated ID", async () => {
            const currency = await repo.insert(BASE_INPUT);
            if (!currency) throw new Error("Insert failed");
            expect(currency.id).toMatch(/^fcur_/);
            expect(currency.code).toBe("TST");
            expect(currency.archivedAt).toBeNull();
        });

        it("returns null on duplicate code (DB constraint)", async () => {
            await repo.insert(BASE_INPUT);
            const second = await repo.insert(BASE_INPUT);
            expect(second).toBeNull();
        });
    });

    describe("findById", () => {
        it("returns currency when found", async () => {
            const created = await repo.insert(BASE_INPUT);
            if (!created) throw new Error("Insert failed");
            const found = await repo.findById(created.id);
            expect(found?.id).toBe(created.id);
        });

        it("returns null when not found", async () => {
            const found = await repo.findById("fcur_ghost");
            expect(found).toBeNull();
        });
    });

    describe("findByCode", () => {
        it("returns currency when found (case-insensitive)", async () => {
            await repo.insert(BASE_INPUT);
            const found = await repo.findByCode("tst");
            expect(found?.code).toBe("TST");
        });

        it("returns null when not found", async () => {
            const found = await repo.findByCode("GPB");
            expect(found).toBeNull();
        });
    });

    describe("findAllActive", () => {
        it("only returns non-archived currencies", async () => {
            const active = await repo.insert(BASE_INPUT);
            if (!active) throw new Error("Insert failed");
            const archived = await repo.insert({ code: "ARC", name: "Archived", symbol: "A" });
            if (!archived) throw new Error("Insert failed");
            await repo.archive(archived.id);

            const results = await repo.findAllActive();
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });
    });

    describe("archive", () => {
        it("sets archivedAt timestamp", async () => {
            const currency = await repo.insert(BASE_INPUT);
            if (!currency) throw new Error("Insert failed");
            const updated = await repo.archive(currency.id);
            expect(updated?.archivedAt).toBeInstanceOf(Date);
        });

        it("returns null when currency not found", async () => {
            const result = await repo.archive("fcur_ghost");
            expect(result).toBeNull();
        });
    });
});
