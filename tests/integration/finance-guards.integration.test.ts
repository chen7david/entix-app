import { env } from "cloudflare:test";
import app from "@api/app";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { FINANCIAL_CURRENCIES, getTreasuryAccountId } from "@shared";
import { financialAccounts } from "@shared/db/schema";
import { walletAccountDTOSchema } from "@shared/schemas/dto/financial.dto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg, createSuperAdmin } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Financial Account Type Guards", () => {
    let adminClient: TestClient;
    let orgId: string;
    let savingsAccId: string;
    let fundingAccId: string;
    const currencyId = FINANCIAL_CURRENCIES.USD;
    const treasuryAccId = getTreasuryAccountId(currencyId);

    beforeEach(async () => {
        const db = await createTestDb();

        // Authenticated org member + super admin
        const { cookie: orgCookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        const { cookie: adminCookie } = await createSuperAdmin({ app, env });

        const orgClient = createTestClient(app, env, orgCookie);
        adminClient = createTestClient(app, env, adminCookie);
        orgId = id;

        // Ensure treasury has enough balance
        await db
            .update(financialAccounts)
            .set({ balanceCents: 100_000_000, accountType: "treasury", isActive: true })
            .where(eq(financialAccounts.id, treasuryAccId));

        // Create funding account (org-owned) by activating USD for the org
        const activateRes = await orgClient.orgs.finance.activateCurrency(orgId, {
            currencyId,
        });
        expect(activateRes.status).toBe(HttpStatusCodes.CREATED);
        const fundingAcc = walletAccountDTOSchema.parse(
            ((await activateRes.json()) as any).data ?? (await activateRes.json())
        );
        fundingAccId = fundingAcc.id;

        // Create savings account (user-owned) via org finance createAccount
        const savingsRes = await orgClient.orgs.finance.createAccount(orgId, {
            name: "Savings",
            currencyId,
            ownerType: "user",
            ownerId: orgId, // scoped to org, user-typed
        });
        expect(savingsRes.status).toBe(HttpStatusCodes.CREATED);
        const savingsAcc = walletAccountDTOSchema.parse(
            ((await savingsRes.json()) as any).data ?? (await savingsRes.json())
        );
        savingsAccId = savingsAcc.id;

        // Seed savings with balance so debit attempts are not short-circuited by insufficient funds
        await db
            .update(financialAccounts)
            .set({ balanceCents: 50_000, accountType: "savings" })
            .where(eq(financialAccounts.id, savingsAccId));
    });

    // ✅ VALID: Treasury → Funding
    it("should allow Treasury → Funding (platform crediting an org) [201]", async () => {
        const res = await adminClient.admin.finance.adminCredit(orgId, {
            categoryId: "fcat_cash_deposit",
            platformTreasuryAccountId: treasuryAccId,
            destinationAccountId: fundingAccId,
            currencyId,
            amountCents: 1_000,
            description: "Platform funding org General Fund",
        });

        expect(res.status).toBe(HttpStatusCodes.CREATED);
    });

    // ❌ INVALID: Treasury → Savings
    it("should block Treasury → Savings (illegal direct personal deposit) [403]", async () => {
        const res = await adminClient.admin.finance.adminCredit(orgId, {
            categoryId: "fcat_cash_deposit",
            platformTreasuryAccountId: treasuryAccId,
            destinationAccountId: savingsAccId,
            currencyId,
            amountCents: 1_000,
            description: "Illegal direct deposit to savings",
        });

        expect(res.status).toBe(HttpStatusCodes.FORBIDDEN);
        const body = (await res.json()) as { error: string };
        expect(body.error).toMatch(
            /Treasury accounts can only interact with Funding, System, or other Treasury accounts/i
        );
    });

    // ❌ INVALID: Savings → Treasury
    it("should block Savings → Treasury (illegal direct personal return) [403]", async () => {
        const res = await adminClient.admin.finance.adminDebit(orgId, {
            categoryId: "fcat_cash_deposit",
            sourceAccountId: savingsAccId,
            platformTreasuryAccountId: treasuryAccId,
            currencyId,
            amountCents: 1_000,
            description: "Illegal direct return from savings to treasury",
        });

        expect(res.status).toBe(HttpStatusCodes.FORBIDDEN);
        const body = (await res.json()) as { error: string };
        expect(body.error).toMatch(
            /Treasury accounts can only interact with Funding, System, or other Treasury accounts/i
        );
    });

    // ✅ VALID: Funding → Treasury
    it("should allow Funding → Treasury (org returning funds to platform) [201]", async () => {
        // First credit the funding account so it has balance to return
        const creditRes = await adminClient.admin.finance.adminCredit(orgId, {
            categoryId: "fcat_cash_deposit",
            platformTreasuryAccountId: treasuryAccId,
            destinationAccountId: fundingAccId,
            currencyId,
            amountCents: 5_000,
        });
        expect(creditRes.status).toBe(HttpStatusCodes.CREATED);

        // Now debit it back to treasury
        const res = await adminClient.admin.finance.adminDebit(orgId, {
            categoryId: "fcat_cash_deposit",
            sourceAccountId: fundingAccId,
            platformTreasuryAccountId: treasuryAccId,
            currencyId,
            amountCents: 5_000,
            description: "Org returning funds to platform treasury",
        });

        expect(res.status).toBe(HttpStatusCodes.CREATED);
    });
});
