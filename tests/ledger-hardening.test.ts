import { ConflictError } from "@api/errors/app.error";
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

        await db.insert(authMembers).values([
            { id: "mem_123", organizationId: orgId, userId, role: "owner", createdAt: new Date() },
            { id: "mem_456", organizationId: "org_789", userId, role: "member", createdAt: new Date() },
        ]);

        // --- 1. Multi-Account for Organizations ---

        const gf = await orgService.createOrgAccount(
            { name: "General Fund", currencyId: FINANCIAL_CURRENCIES.USD, organizationId: orgId },
            { allowMultiple: true }
        );
        expect(gf?.name).toBe("General Fund");

        const pr = await orgService.createOrgAccount(
            { name: "Payroll", currencyId: FINANCIAL_CURRENCIES.USD, organizationId: orgId },
            { allowMultiple: true }
        );
        expect(pr?.name).toBe("Payroll");

        // --- 2. Name + Currency Uniqueness ---

        // Duplicate name + currency should throw ConflictError
        await expect(
            orgService.createOrgAccount(
                { name: "Payroll", currencyId: FINANCIAL_CURRENCIES.USD, organizationId: orgId },
                { allowMultiple: true }
            )
        ).rejects.toThrow(ConflictError);

        // Same name, different currency should succeed
        const pr2 = await orgService.createOrgAccount(
            { name: "Payroll", currencyId: FINANCIAL_CURRENCIES.EUR, organizationId: orgId },
            { allowMultiple: true }
        );
        expect(pr2?.name).toBe("Payroll");

        // --- 3. User Wallet Restrictions ---

        await userService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId,
            orgId,
        });

        // Second USD wallet with allowMultiple: false should throw ConflictError
        await expect(
            userService.createUserAccount(
                { name: "Secret Stash", currencyId: FINANCIAL_CURRENCIES.USD, userId, orgId },
                { allowMultiple: false }
            )
        ).rejects.toThrow(ConflictError);

        // allowMultiple: true should succeed
        const travel = await userService.createUserAccount(
            { name: "Travel", currencyId: FINANCIAL_CURRENCIES.USD, userId, orgId },
            { allowMultiple: true }
        );
        expect(travel?.name).toBe("Travel");

        // --- 4. Org-Scoping ---

        // Same user, different org should succeed
        const otherOrgSavings = await userService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId,
            orgId: "org_789",
        });
        expect(otherOrgSavings?.name).toBe("Savings");

        const summaryOrgA = await userService.getUserSummary(userId, orgId);
        const summaryOrgB = await userService.getUserSummary(userId, "org_789");

        expect(summaryOrgA.accounts.length).toBe(2); // Savings + Travel
        expect(summaryOrgB.accounts.length).toBe(1); // Savings
        expect(summaryOrgA.accounts[0].id).not.toBe(summaryOrgB.accounts[0].id);
    });

    it("should not return Org A wallet when querying Org B (Model B Isolation)", async () => {
        const userId = "user_iso_888";
        const orgAId = "org_A_iso";
        const orgBId = "org_B_iso";

        await db.insert(authUsers).values({
            id: userId,
            name: "Iso User",
            email: "iso@entix.app",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await db.insert(authOrganizations).values([
            { id: orgAId, name: "Org A", slug: "org-a", createdAt: new Date() },
            { id: orgBId, name: "Org B", slug: "org-b", createdAt: new Date() },
        ]);

        await db.insert(authMembers).values([
            { id: "mem_A", organizationId: orgAId, userId, role: "member", createdAt: new Date() },
            { id: "mem_B", organizationId: orgBId, userId, role: "member", createdAt: new Date() },
        ]);

        await userService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId,
            orgId: orgAId,
        });

        const orgBAccounts = await userService.listUserAccounts(userId, orgBId);
        expect(orgBAccounts, "Org B should have zero accounts because wallets are org-scoped").toHaveLength(0);

        const orgAAccounts = await userService.listUserAccounts(userId, orgAId);
        expect(orgAAccounts).toHaveLength(1);
    });
});
