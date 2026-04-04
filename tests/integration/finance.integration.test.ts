import { env } from "cloudflare:test";
import app from "@api/app";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { FINANCIAL_CURRENCIES, getTreasuryAccountId } from "@shared";
import { financialAccounts } from "@shared/db/schema";
import {
    currencyListWithStatusResponseSchema,
    walletAccountDTOSchema,
} from "@shared/schemas/dto/financial.dto";
import { eq } from "drizzle-orm";
import { assert, beforeEach, describe, expect, it } from "vitest";
import type { z } from "zod";
import { createAuthenticatedOrg, createSuperAdmin } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

async function assertOk<T extends z.ZodTypeAny>(
    response: Response,
    schema: T,
    context: string
): Promise<z.infer<T>> {
    const status = response.status;
    const body = (await response.json()) as any;

    if (status >= 400) {
        console.error(`[TEST ERROR] ${context}: ${status}`, body);
        throw new Error(`${context} failed with status ${status}`);
    }

    // Robust validation: try parsing the whole envelope first, then fallback to unwrapped data
    let parsed = schema.safeParse(body);
    if (!parsed.success && body.data) {
        const nestedParsed = schema.safeParse(body.data);
        if (nestedParsed.success) {
            parsed = nestedParsed;
        }
    }

    if (!parsed.success) {
        console.error(`[ZOD ERROR] ${context}:`, parsed.error.flatten());
        throw new Error(`${context} response validation failed`);
    }

    return parsed.data;
}

describe("Finance Integration Tests", () => {
    let client: TestClient;
    let adminClient: TestClient;
    let orgId: string;
    let db: any; // Type as needed, but here we just need access
    const treasuryId = getTreasuryAccountId(FINANCIAL_CURRENCIES.USD);

    beforeEach(async () => {
        db = await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        const { cookie: adminCookie } = await createSuperAdmin({ app, env });

        client = createTestClient(app, env, cookie);
        adminClient = createTestClient(app, env, adminCookie);
        orgId = id;

        // Seed Treasury with massive balance for testing via Drizzle (catches schema drift)
        await db
            .update(financialAccounts)
            .set({ balanceCents: 100000000, accountType: "treasury", isActive: true })
            .where(eq(financialAccounts.id, treasuryId));
    });

    describe("Internal Transfers", () => {
        it("should fail transfer with 400 when source has insufficient funds", async () => {
            const statusRes = await client.orgs.finance.getOrgCurrencyStatus(orgId);
            const status = await assertOk(
                statusRes,
                currencyListWithStatusResponseSchema,
                "Get Org Currency Status"
            );

            const usd = status.data.find((c: any) => c.code === "USD");
            if (!usd) throw new Error("USD not found");

            let sourceAccountId: string;
            if (!usd.isActivated) {
                const activateRes = await client.orgs.finance.activateCurrency(orgId, {
                    currencyId: usd.id,
                });
                const account = await assertOk(
                    activateRes,
                    walletAccountDTOSchema,
                    "Activate USD Currency"
                );
                sourceAccountId = account.id;
            } else {
                assert(usd.accountId, "USD accountId missing despite being activated");
                sourceAccountId = usd.accountId;
            }

            const createRes = await client.orgs.finance.createAccount(orgId, {
                name: "Savings",
                currencyId: usd.id,
                ownerType: "org",
                ownerId: orgId,
            });
            const destAccount = await assertOk(
                createRes,
                walletAccountDTOSchema,
                "Create Savings Account"
            );
            const destAccountId = destAccount.id;

            const transferRes = await client.orgs.finance.executeTransfer(orgId, {
                categoryId: "fcat_internal_transfer",
                sourceAccountId,
                destinationAccountId: destAccountId,
                currencyId: usd.id,
                amountCents: 1000000,
                description: "Test Transfer",
            });

            expect(transferRes.status).toBe(HttpStatusCodes.BAD_REQUEST);
            const body = (await transferRes.json()) as { error: string };
            expect(body.error).toMatch(/Insufficient funds/i);
        });

        it("should fail transfer with 400 when currencies mismatch", async () => {
            const statusRes = await client.orgs.finance.getOrgCurrencyStatus(orgId);
            const status = await assertOk(
                statusRes,
                currencyListWithStatusResponseSchema,
                "Get Org Currency Status (Mismatch Test)"
            );

            const usd = status.data.find((c: any) => c.code === "USD");
            const eur = status.data.find((c: any) => c.code === "EUR");
            assert(usd, "USD currency not found in status list");
            assert(eur, "EUR currency not found in status list");

            const activateUsd = await client.orgs.finance.activateCurrency(orgId, {
                currencyId: usd.id,
            });
            const activateEur = await client.orgs.finance.activateCurrency(orgId, {
                currencyId: eur.id,
            });

            const usdAccount = await assertOk(activateUsd, walletAccountDTOSchema, "Activate USD");
            const eurAccount = await assertOk(activateEur, walletAccountDTOSchema, "Activate EUR");

            // Try to transfer USD from a USD account to a EUR account using currencyId=EUR
            const transferRes = await client.orgs.finance.executeTransfer(orgId, {
                categoryId: "fcat_internal_transfer",
                sourceAccountId: usdAccount.id,
                destinationAccountId: eurAccount.id,
                currencyId: eur.id,
                amountCents: 100,
            });

            expect(transferRes.status).toBe(HttpStatusCodes.BAD_REQUEST);
            const body = (await transferRes.json()) as { error: string };
            expect(body.error).toMatch(/currency mismatch/i);
        });
    });

    describe("Account Archiving", () => {
        it("should allow archiving an account with zero balance", async () => {
            const statusRes = await client.orgs.finance.getOrgCurrencyStatus(orgId);
            const status = await assertOk(
                statusRes,
                currencyListWithStatusResponseSchema,
                "Get Org Status (Archive Test)"
            );
            const usd = status.data.find((c: any) => c.code === "USD");
            assert(usd, "USD currency not found in status list");

            const createRes = await client.orgs.finance.createAccount(orgId, {
                name: "To Archive",
                currencyId: usd.id,
                ownerType: "org",
                ownerId: orgId,
            });
            const account = await assertOk(
                createRes,
                walletAccountDTOSchema,
                "Create Archive Account"
            );

            const archiveRes = await adminClient.admin.finance.archiveAccount(account.id);
            expect(archiveRes.status).toBe(HttpStatusCodes.OK);
            expect(await archiveRes.json()).toEqual({ success: true });
        });

        it("should fail archiving with 400 when balance is non-zero", async () => {
            const statusRes = await client.orgs.finance.getOrgCurrencyStatus(orgId);
            const status = await assertOk(
                statusRes,
                currencyListWithStatusResponseSchema,
                "Get Org Status (Non-Zero Test)"
            );
            const usd = status.data.find((c: any) => c.code === "USD");
            assert(usd, "USD currency not found in status list");

            // Activate USD (creates a funding account)
            const activateRes = await client.orgs.finance.activateCurrency(orgId, {
                currencyId: usd.id,
            });
            const account = await assertOk(
                activateRes,
                walletAccountDTOSchema,
                "Activate Funding Account"
            );
            const accountId = account.id;

            // Credit the funding account from treasury (which is allowed)
            const creditRes = await adminClient.admin.finance.adminCredit(orgId, {
                categoryId: "fcat_cash_deposit",
                platformTreasuryAccountId: treasuryId,
                destinationAccountId: accountId,
                currencyId: usd.id,
                amountCents: 100,
            });
            expect(creditRes.status).toBe(HttpStatusCodes.CREATED);

            // Attempt to archive the account with balance
            const archiveRes = await adminClient.admin.finance.archiveAccount(accountId);
            expect(archiveRes.status).toBe(HttpStatusCodes.BAD_REQUEST);
            const body = (await archiveRes.json()) as { error: string };
            expect(body.error).toMatch(/non-zero balance/i);
        });

        it("should return 404 when archiving non-existent account", async () => {
            const archiveRes = await adminClient.admin.finance.archiveAccount("non-existent-id");
            expect(archiveRes.status).toBe(HttpStatusCodes.NOT_FOUND);
        });
    });
});
