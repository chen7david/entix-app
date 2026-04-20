import { env } from "cloudflare:test";
import app from "@api/app";
import { FinancialAccountsRepository } from "@api/repositories/financial/financial-accounts.repository";
import { generateAccountId, generateOpaqueId } from "@shared";
import { authOrganizations, financialAccounts, financialTransactions } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createSuperAdmin } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Financial Idempotency Verification", () => {
    let db: ReturnType<typeof createTestDb> extends Promise<infer U> ? U : never;
    let superAdminCookie: string;
    let targetAccountId: string;
    let organizationId: string;

    const TREASURY_ACCOUNT_ID = "facc_treasury_fcur_usd";
    const CURRENCY_ID = "fcur_usd";
    const CATEGORY_ID = "fcat_internal_transfer";

    beforeEach(async () => {
        db = await createTestDb();
        createTestClient(app, env);

        // 1. Setup Super Admin
        const admin = await createSuperAdmin({ app, env });
        superAdminCookie = admin.cookie;

        // 2. Setup Test Organization
        organizationId = `org_${generateOpaqueId()}`;
        await db.insert(authOrganizations).values({
            id: organizationId,
            name: "Test Idempotency Org",
            slug: `test-idem-org-${generateOpaqueId()}`,
            createdAt: new Date(),
        });

        // 3. Setup Target Funding Account
        targetAccountId = generateAccountId();
        const repo = new FinancialAccountsRepository(db as any);
        await repo.insert({
            id: targetAccountId,
            ownerId: organizationId,
            ownerType: "org",
            currencyId: CURRENCY_ID,
            organizationId: organizationId,
            name: "Target Funding",
            accountType: "funding",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });

    /**
     * VERIFICATION: Concurrent requests with the same Idempotency-Key.
     * With the three-layered defense:
     * 1. Middleware should catch the second request (replay or conflict).
     * 2. Transaction logic uses db.batch for atomicity.
     * 3. DB has a unique index on idempotencyKey.
     */
    it("should prevent double-debiting when concurrent requests use the same Idempotency-Key", async () => {
        const idempotencyKey = `idem_${generateOpaqueId()}`;
        const amountCents = 1000; // $10.00

        const payload = {
            categoryId: CATEGORY_ID,
            platformTreasuryAccountId: TREASURY_ACCOUNT_ID,
            destinationAccountId: targetAccountId,
            currencyId: CURRENCY_ID,
            amountCents,
            description: "Idempotency verification test",
        };

        const makeRequest = () =>
            app.request(
                `/api/v1/admin/finance/orgs/${organizationId}/credit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: superAdminCookie,
                        "Idempotency-Key": idempotencyKey,
                    },
                    body: JSON.stringify(payload),
                },
                env
            );

        const [res1, res2] = await Promise.all([makeRequest(), makeRequest()]);
        const statuses = [res1.status, res2.status].sort();

        // One MUST succeed (201).
        expect(statuses).toContain(201);

        // The other must be a safe outcome — either a replayed success or a conflict.
        // It must NOT be a second independent 201 (that would mean double-debit).
        const secondStatus = statuses.find((s) => s !== 201) ?? statuses[1];
        expect([200, 201, 409]).toContain(secondStatus);

        // If both returned 201, verify they are the SAME transaction (KV replay).
        if (statuses[0] === 201 && statuses[1] === 201) {
            const body1 = await res1.json();
            const body2 = await res2.json();
            // Replayed responses have the same transaction ID.
            expect((body1 as any).data?.id).toBe((body2 as any).data?.id);
        }

        // The ultimate proof: check the account balance
        const account = await db.query.financialAccounts.findFirst({
            where: eq(financialAccounts.id, targetAccountId),
        });

        // Balance must be exactly the amount of ONE transaction
        expect(account?.balanceCents).toBe(amountCents);

        // Ensure no extra transaction records were created
        const transactions = await db.query.financialTransactions.findMany({
            where: eq(financialTransactions.organizationId, organizationId),
        });
        expect(transactions.length).toBe(1);
    });
});
