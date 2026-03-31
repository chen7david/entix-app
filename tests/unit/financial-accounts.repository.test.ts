import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { authOrganizations, financialAccounts, financialCurrencies } from "@shared/db/schema";
import { financialCurrencySeed } from "@shared/db/seed/financial-currencies";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../lib/utils";

describe("financialAccountsRepository", () => {
    let db: TestDb;
    let repo: FinancialAccountsRepository;

    // Factory for variations in test data
    const makeInput = (overrides = {}) => ({
        ownerId: "user_test_01",
        ownerType: "user" as const,
        currencyId: "fcur_usd",
        organizationId: "org_test_01",
        name: "Personal Wallet",
        ...overrides,
    });

    const BASE_INPUT = makeInput();

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

    // ─── create ──────────────────────────────────────────────────────────────────

    describe("create", () => {
        it("returns account with correct defaults", async () => {
            const account = await repo.create(BASE_INPUT);

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
            const account = await repo.create(
                makeInput({
                    ownerId: "org_test_01",
                    ownerType: "org",
                    currencyId: "fcur_cad",
                    organizationId: null,
                    name: "Store Revenue",
                })
            );
            expect(account.ownerType).toBe("org");
            expect(account.currencyId).toBe("fcur_cad");
        });

        it("allows multiple accounts per owner", async () => {
            await repo.create(BASE_INPUT);
            await repo.create(makeInput({ name: "Savings" }));
            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(2);
        });

        it("throws on unknown currencyId (FK violation)", async () => {
            await expect(
                repo.create(makeInput({ currencyId: "fcur_nonexistent" }))
            ).rejects.toThrow();
        });
    });

    // ─── findById ────────────────────────────────────────────────────────────────

    describe("findById", () => {
        it("returns account when found", async () => {
            const created = await repo.create(BASE_INPUT);
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
            const active = await repo.create(BASE_INPUT);
            const inactive = await repo.create(makeInput({ name: "Inactive" }));
            await repo.deactivate(inactive.id);

            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });

        it("excludes archived accounts", async () => {
            const active = await repo.create(BASE_INPUT);
            const archived = await repo.create(makeInput({ name: "Archived" }));
            await repo.archive(archived.id);

            const results = await repo.findActiveByOwner("user_test_01", "user", "org_test_01");
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(active.id);
        });

        it("does not return other owners accounts", async () => {
            await repo.create(BASE_INPUT);
            await repo.create(
                makeInput({
                    ownerId: "org_test_01",
                    ownerType: "org",
                    organizationId: null,
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
            const account = await repo.create(BASE_INPUT);
            const updated = await repo.deactivate(account.id);
            expect(updated.isActive).toBe(false);
        });

        it("returns null when account not found", async () => {
            const result = await repo.deactivate("facc_ghost");
            expect(result).toBeNull();
        });

        it("deactivated account is still findable by id", async () => {
            const account = await repo.create(BASE_INPUT);
            await repo.deactivate(account.id);
            const found = await repo.findById(account.id);
            expect(found).not.toBeNull();
            expect(found?.isActive).toBe(false);
        });
    });

    // ─── archive ─────────────────────────────────────────────────────────────────

    describe("archive", () => {
        it("sets archivedAt to a timestamp", async () => {
            const account = await repo.create(BASE_INPUT);
            const updated = await repo.archive(account.id);
            expect(updated.archivedAt).toBeInstanceOf(Date);
        });

        it("returns null when account not found", async () => {
            const result = await repo.archive("facc_ghost");
            expect(result).toBeNull();
        });

        it("archived account is still findable by id", async () => {
            const account = await repo.create(BASE_INPUT);
            await repo.archive(account.id);
            const found = await repo.findById(account.id);
            expect(found?.archivedAt).not.toBeNull();
        });

        it("account can be both deactivated and archived", async () => {
            const account = await repo.create(BASE_INPUT);
            await repo.deactivate(account.id);
            await repo.archive(account.id);
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
