import { BadRequestError } from "@api/errors/app.error";
import { financialCurrencySeed } from "@api/db/seed/financial.seed";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import {
    authOrganizations,
    type CreateAccountRepoInput,
    financialAccounts,
    financialCurrencies,
} from "@shared/db/schema";
import { nanoid } from "nanoid";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../lib/utils";

describe("financialAccountsRepository", () => {
    let db: TestDb;
    let repo: FinancialAccountsRepository;

    // Factory for variations in test data
    const makeAccountInput = (
        overrides?: Partial<CreateAccountRepoInput>
    ): CreateAccountRepoInput => ({
        id: `facc_${nanoid()}`,
        ownerId: "user_test_01",
        ownerType: "user",
        currencyId: "fcur_usd",
        organizationId: "org_test_01",
        name: "Personal Wallet",
        accountType: "standard",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    const BASE_INPUT = makeAccountInput();

    beforeEach(async () => {
        db = await createTestDb();
        repo = new FinancialAccountsRepository(db as any);

        /**
         * Delete in FK dependency order: children before parents.
         * Although these tables are currently independent of other modules,
         * we maintain strict order for modular consistency.
         */
        await db.delete(financialAccounts);
        await db.delete(financialCurrencies);
        await db.delete(authOrganizations);

        // Seed required currencies
        await db.insert(financialCurrencies).values(financialCurrencySeed);

        // Seed a test organization
        await db.insert(authOrganizations).values({
            id: "org_test_01",
            name: "Test Organization",
            slug: "test-org",
            createdAt: new Date(),
        });
    });

    // ─── insert ──────────────────────────────────────────────────────────────────

    describe("insert", () => {
        it("returns account with correct defaults", async () => {
            const account = await repo.insert(BASE_INPUT);
            if (!account) throw new Error("Insert failed");

            expect(account.id).toMatch(/^facc_/);
            expect(account.ownerId).toBe("user_test_01");
            expect(account.ownerType).toBe("user");
            expect(account.currencyId).toBe("fcur_usd");
            expect(account.name).toBe("Personal Wallet");
            expect(account.balanceCents).toBe(0);
            expect(account.isActive).toBe(true);
            expect(account.archivedAt).toBeNull();
            expect(account.createdAt).toBeInstanceOf(Date);
        });

        it("creates an org account", async () => {
            const account = await repo.insert(
                makeAccountInput({
                    ownerId: "org_test_01",
                    ownerType: "org",
                    currencyId: "fcur_cad",
                    organizationId: "org_test_01",
                    name: "Store Revenue",
                })
            );
            if (!account) throw new Error("Insert failed");
            expect(account.ownerType).toBe("org");
            expect(account.currencyId).toBe("fcur_cad");
        });

        it("allows multiple accounts per owner", async () => {
            await repo.insert(BASE_INPUT);
            await repo.insert(makeAccountInput({ name: "Savings" }));
            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(2);
        });

        it("throws BadRequestError on unknown currencyId (FK violation)", async () => {
            await expect(
                repo.insert(makeAccountInput({ currencyId: "fcur_nonexistent" }))
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ─── findById ────────────────────────────────────────────────────────────────

    describe("findById", () => {
        it("returns account when found", async () => {
            const created = await repo.insert(BASE_INPUT);
            if (!created) throw new Error("Insert failed");
            const found = await repo.findById(created.id);
            expect(found?.id).toBe(created.id);
        });

        it("returns null when not found", async () => {
            const found = await repo.findById("facc_ghost");
            expect(found).toBeNull();
        });
    });

    // ─── findActiveByOwner ───────────────────────────────────────────────────────

    describe("findActiveByOwner", () => {
        it("returns empty array when no accounts exist", async () => {
            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(0);
        });

        it("excludes deactivated accounts", async () => {
            const active = await repo.insert(BASE_INPUT);
            if (!active) throw new Error("Insert failed");
            const inactive = await repo.insert(makeAccountInput({ name: "Inactive" }));
            if (!inactive) throw new Error("Insert failed");
            await repo.deactivate(inactive.id, new Date());

            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });

        it("excludes archived accounts", async () => {
            const active = await repo.insert(BASE_INPUT);
            if (!active) throw new Error("Insert failed");
            const archived = await repo.insert(makeAccountInput({ name: "Archived" }));
            if (!archived) throw new Error("Insert failed");
            await repo.archive(archived.id, new Date());

            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });

        it("does not return other owners accounts", async () => {
            await repo.insert(BASE_INPUT);
            await repo.insert(
                makeAccountInput({
                    ownerId: "org_test_01",
                    ownerType: "org",
                    organizationId: "org_test_01",
                    name: "Org Revenue",
                })
            );

            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(1);
            expect(results[0].ownerType).toBe("user");
        });
    });

    // ─── deactivate ──────────────────────────────────────────────────────────────

    describe("deactivate", () => {
        it("sets isActive to false", async () => {
            const account = await repo.insert(BASE_INPUT);
            if (!account) throw new Error("Insert failed");
            const updated = await repo.deactivate(account.id, new Date());
            expect(updated?.isActive).toBe(false);
        });

        it("returns null when account not found", async () => {
            const result = await repo.deactivate("facc_ghost", new Date());
            expect(result).toBeNull();
        });

        it("deactivated account is still findable by id", async () => {
            const account = await repo.insert(BASE_INPUT);
            if (!account) throw new Error("Insert failed");
            await repo.deactivate(account.id, new Date());
            const found = await repo.findById(account.id);
            expect(found).not.toBeNull();
            expect(found?.isActive).toBe(false);
        });
    });

    // ─── archive ─────────────────────────────────────────────────────────────────

    describe("archive", () => {
        it("sets archivedAt to a timestamp", async () => {
            const account = await repo.insert(BASE_INPUT);
            if (!account) throw new Error("Insert failed");
            const updated = await repo.archive(account.id, new Date());
            expect(updated?.archivedAt).toBeInstanceOf(Date);
        });

        it("returns null when account not found", async () => {
            const result = await repo.archive("facc_ghost", new Date());
            expect(result).toBeNull();
        });

        it("archived account is still findable by id", async () => {
            const account = await repo.insert(BASE_INPUT);
            if (!account) throw new Error("Insert failed");
            await repo.archive(account.id, new Date());
            const found = await repo.findById(account.id);
            expect(found?.archivedAt).not.toBeNull();
        });

        it("account can be both deactivated and archived", async () => {
            const account = await repo.insert(BASE_INPUT);
            if (!account) throw new Error("Insert failed");
            await repo.deactivate(account.id, new Date());
            await repo.archive(account.id, new Date());
            const found = await repo.findById(account.id);
            expect(found?.isActive).toBe(false);
            expect(found?.archivedAt).toBeInstanceOf(Date);
        });
    });

    // ─── no delete ───────────────────────────────────────────────────────────────

    describe("delete must not exist", () => {
        it("exposes no delete or remove method", () => {
            expect((repo as any).delete).toBeUndefined();
            expect((repo as any).remove).toBeUndefined();
            expect((repo as any).hardDelete).toBeUndefined();
            expect((repo as any).destroy).toBeUndefined();
        });
    });
});
