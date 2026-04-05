import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { FinancialCurrenciesRepository } from "@api/repositories/financial/financial-currencies.repository";
import { FinancialOrgSettingsRepository } from "@api/repositories/financial/financial-org-settings.repository";
import { FinancialTransactionsRepository } from "@api/repositories/financial/financial-transactions.repository";
import { OrgFinancialService } from "@api/services/financial/org-financial.service";
import { UserFinancialService } from "@api/services/financial/user-financial.service";
import { FINANCIAL_CURRENCIES } from "@shared";
import { authMembers, authOrganizations, authUsers } from "@shared/db/schema";
import { describe, expect, it } from "vitest";
import { createTestDb } from "./lib/utils";

describe("Ledger Hardening - Name Uniqueness", async () => {
    const db = await createTestDb();

    // Repos
    const accountsRepo = new FinancialAccountsRepository(db);
    const currenciesRepo = new FinancialCurrenciesRepository(db);
    const txRepo = new FinancialTransactionsRepository(db);
    const settingsRepo = new FinancialOrgSettingsRepository(db);

    // Services
    const orgService = new OrgFinancialService(db, accountsRepo, txRepo, currenciesRepo);
    const userService = new UserFinancialService(
        db,
        accountsRepo,
        txRepo,
        currenciesRepo,
        settingsRepo
    );

    it("should enforce ledger hardening rules (sequential flow)", async () => {
        const userId = "user_456";
        const orgId = "org_123";

        // 1. Seed User & Organization (FK compliance)
        await db.insert(authUsers).values({
            id: userId,
            name: "Test User",
            email: "test@entix.app",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await db.insert(authOrganizations).values([
            { id: orgId, name: "Entix Academy", slug: "entix-academy", createdAt: new Date() },
            { id: "org_789", name: "Entix Sports", slug: "entix-sports", createdAt: new Date() },
        ]);

        // Seed Members for scoping compliance
        await db.insert(authMembers).values([
            {
                id: "mem_123",
                organizationId: orgId,
                userId: userId,
                role: "owner",
                createdAt: new Date(),
            },
            {
                id: "mem_456",
                organizationId: "org_789",
                userId: userId,
                role: "member",
                createdAt: new Date(),
            },
        ]);

        // --- 1. Multi-Account for Organizations ---

        // Create General Fund
        const gf = await orgService.createOrgAccount(
            {
                name: "General Fund",
                currencyId: FINANCIAL_CURRENCIES.USD,
                organizationId: orgId,
            },
            { allowMultiple: true }
        );
        expect(gf.id).toBeDefined();

        // Create Payroll in same currency (Should succeed now)
        const pr = await orgService.createOrgAccount(
            {
                name: "Payroll",
                currencyId: FINANCIAL_CURRENCIES.USD,
                organizationId: orgId,
            },
            { allowMultiple: true }
        );
        expect(pr.id).toBeDefined();
        expect(pr.name).toBe("Payroll");

        // --- 2. Name Uniqueness Relaxation (Name + Currency Scoped) ---

        // Try to create another "Payroll" in a DIFFERENT currency (Should SUCCEED)
        const pr2 = await orgService.createOrgAccount(
            {
                name: "Payroll",
                currencyId: FINANCIAL_CURRENCIES.EUR,
                organizationId: orgId,
            },
            { allowMultiple: true }
        );
        expect(pr2.id).toBeDefined();
        expect(pr2.name).toBe("Payroll");

        // --- 3. User Wallet Restrictions (SOFT CONSTRAINT) ---

        // Create first Savings for user in Org A
        await userService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId: userId,
            orgId: orgId,
        });

        // Try second USD account (Should fail even with different name if allowMultiple is false)
        await expect(
            userService.createUserAccount(
                {
                    name: "Secret Stash",
                    currencyId: FINANCIAL_CURRENCIES.USD,
                    userId: userId,
                    orgId: orgId,
                },
                { allowMultiple: false }
            )
        ).rejects.toThrow(/already exists/);

        // Allow multiple if explicitly requested
        const travel = await userService.createUserAccount(
            {
                name: "Travel",
                currencyId: FINANCIAL_CURRENCIES.USD,
                userId: userId,
                orgId: orgId,
            },
            { allowMultiple: true }
        );
        expect(travel.id).toBeDefined();

        // --- 4. Org-Scoping (Model B Verification) ---
        const otherOrgId = "org_789";

        // Should SUCCEED to create another "Savings" for the SAME user in a DIFFERENT org
        const otherOrgSavings = await userService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId: userId,
            orgId: otherOrgId,
        });

        expect(otherOrgSavings.id).toBeDefined();

        const summaryOrgA = await userService.getUserSummary(userId, orgId);
        const summaryOrgB = await userService.getUserSummary(userId, otherOrgId);

        expect(summaryOrgA.accounts.length).toBe(2); // Savings + Travel
        expect(summaryOrgB.accounts.length).toBe(1); // Savings (New)
        expect(summaryOrgA.accounts[0].id).not.toBe(summaryOrgB.accounts[0].id);
    });

    it("should not return Org A wallet when querying Org B (Model B Isolation)", async () => {
        const userId = "user_iso_888";
        const orgAId = "org_A_iso";
        const orgBId = "org_B_iso";

        // Seed User
        await db.insert(authUsers).values({
            id: userId,
            name: "Iso User",
            email: "iso@entix.app",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Seed Orgs
        await db.insert(authOrganizations).values([
            { id: orgAId, name: "Org A", slug: "org-a", createdAt: new Date() },
            { id: orgBId, name: "Org B", slug: "org-b", createdAt: new Date() },
        ]);

        // Seed Memberships
        await db.insert(authMembers).values([
            {
                id: "mem_A",
                organizationId: orgAId,
                userId: userId,
                role: "member",
                createdAt: new Date(),
            },
            {
                id: "mem_B",
                organizationId: orgBId,
                userId: userId,
                role: "member",
                createdAt: new Date(),
            },
        ]);

        // Provision ONLY in Org A
        await userService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId: userId,
            orgId: orgAId,
        });

        // Query Org B
        const orgBAccounts = await userService.listUserAccounts(userId, orgBId);

        expect(
            orgBAccounts,
            "Org B should have zero accounts because wallets are org-scoped"
        ).toHaveLength(0);

        // Verification: Query Org A to ensure it exists there
        const orgAAccounts = await userService.listUserAccounts(userId, orgAId);
        expect(orgAAccounts).toHaveLength(1);
    });
});
