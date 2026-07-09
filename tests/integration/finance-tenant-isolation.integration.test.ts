import { env } from "cloudflare:test";
import app from "@api/app";
import { FINANCIAL_CURRENCIES } from "@shared";
import { financialAccounts } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

/**
 * Cross-tenant account IDs must not be usable via another org's finance routes.
 */
describe("Finance tenant isolation", () => {
    let orgAClient: TestClient;
    let orgAId: string;
    let orgAFundingId: string;
    let orgBFundingId: string;
    let orgBPayrollId: string;

    beforeEach(async () => {
        const db = await createTestDb();

        const orgA = await createAuthenticatedOrg({ app, env });
        orgAId = orgA.orgId;
        orgAClient = createTestClient(app, env, orgA.cookie);

        const orgB = await createAuthenticatedOrg({ app, env });
        const orgBClient = createTestClient(app, env, orgB.cookie);

        const activateA = await orgAClient.orgs.finance.activateCurrency(orgAId, {
            currencyId: FINANCIAL_CURRENCIES.USD,
        });
        expect(activateA.status).toBe(201);
        orgAFundingId = ((await activateA.json()) as { data: { id: string } }).data.id;

        const activateB = await orgBClient.orgs.finance.activateCurrency(orgB.orgId, {
            currencyId: FINANCIAL_CURRENCIES.USD,
        });
        expect(activateB.status).toBe(201);
        orgBFundingId = ((await activateB.json()) as { data: { id: string } }).data.id;

        const payrollB = await orgBClient.orgs.finance.createAccount(orgB.orgId, {
            name: "Payroll B",
            currencyId: FINANCIAL_CURRENCIES.USD,
            ownerType: "org",
            ownerId: orgB.orgId,
        });
        expect(payrollB.status).toBe(201);
        orgBPayrollId = ((await payrollB.json()) as { data: { id: string } }).data.id;

        // Seed balances so insufficient-funds does not mask tenant checks
        await db
            .update(financialAccounts)
            .set({ balanceCents: 50_000 })
            .where(eq(financialAccounts.id, orgBFundingId));
        await db
            .update(financialAccounts)
            .set({ balanceCents: 50_000 })
            .where(eq(financialAccounts.id, orgAFundingId));
    });

    it("rejects transfer that uses another org's accounts under org A path", async () => {
        const res = await orgAClient.orgs.finance.executeTransfer(orgAId, {
            categoryId: "fcat_internal_transfer",
            sourceAccountId: orgBFundingId,
            destinationAccountId: orgBPayrollId,
            currencyId: FINANCIAL_CURRENCIES.USD,
            amountCents: 100,
            description: "cross-tenant abuse attempt",
        });
        expect(res.status).toBe(403);
    });

    it("rejects transfer mixing local source with foreign destination", async () => {
        const res = await orgAClient.orgs.finance.executeTransfer(orgAId, {
            categoryId: "fcat_internal_transfer",
            sourceAccountId: orgAFundingId,
            destinationAccountId: orgBPayrollId,
            currencyId: FINANCIAL_CURRENCIES.USD,
            amountCents: 100,
            description: "mixed-tenant abuse attempt",
        });
        expect(res.status).toBe(403);
    });

    it("rejects deactivating another org's account via org A path", async () => {
        const res = await orgAClient.request(
            `/api/v1/orgs/${orgAId}/finance/accounts/${orgBFundingId}/deactivate`,
            { method: "PATCH" }
        );
        expect(res.status).toBe(404);
    });
});
