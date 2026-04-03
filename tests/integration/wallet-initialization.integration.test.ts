import { env } from "cloudflare:test";
import app from "@api/app";
import * as schema from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Wallet Initialization & Visibility Diagnostics", () => {
    let orgId: string;
    let userId: string;
    let authCookie: string;

    beforeEach(async () => {
        await createTestDb();
        const auth = await createAuthenticatedOrg({ app, env });
        orgId = auth.orgId;
        userId = auth.orgData.data.user.id;
        authCookie = auth.cookie;
    });

    it("should return existing wallets in summary and prevent duplicate initialization", async () => {
        const db = await createTestDb();
        const client = createTestClient(app, env, authCookie);

        // 1. Manually insert a wallet to simulate 'hidden' state
        const currencyId = "fcur_etd"; // Assuming ETD exists from seeds
        await db.insert(schema.financialAccounts).values({
            id: "test-wallet-id",
            ownerId: userId,
            ownerType: "user",
            organizationId: orgId,
            currencyId: currencyId,
            name: "Test Wallet",
            balanceCents: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 2. Verify visibility in Summary
        const summaryRes = await client.request(
            `/api/v1/orgs/${orgId}/members/${userId}/wallet/summary`,
            {
                method: "GET",
            }
        );
        expect(summaryRes.status).toBe(200);
        const summary = (await summaryRes.json()) as any;

        console.log("Summary Accounts:", JSON.stringify(summary.data.accounts, null, 2));
        expect(summary.data.accounts.length).toBeGreaterThanOrEqual(1);
        const testWallet = summary.data.accounts.find((a: any) => a.id === "test-wallet-id");
        expect(testWallet).toBeDefined();

        // 3. Attempt to initialize (provision) wallets
        // Note: provisioning uses org settings which might include the same currency
        // We'll set up org settings to include ETD
        await db
            .insert(schema.financialOrgSettings)
            .values({
                id: `fos_${orgId}`,
                organizationId: orgId,
                autoProvisionCurrencies: JSON.stringify([currencyId]),
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [schema.financialOrgSettings.organizationId],
                set: {
                    autoProvisionCurrencies: JSON.stringify([currencyId]),
                    updatedAt: new Date(),
                },
            });

        const initRes = await client.request(
            `/api/v1/orgs/${orgId}/members/${userId}/wallet/initialize`,
            {
                method: "POST",
            }
        );

        // 4. Assert Conflict
        // If the wallet already exists, it should throw 409 Conflict
        expect(initRes.status).toBe(409);
        const error = (await initRes.json()) as any;
        expect(error.message).toContain("already exists");
    });

    it("should handle pageSize as a string in transaction history", async () => {
        const client = createTestClient(app, env, authCookie);

        // Use a string for pageSize to simulate a real browser query param
        const res = await client.request(
            `/api/v1/orgs/${orgId}/members/${userId}/wallet/transactions?page=1&pageSize=20`,
            {
                method: "GET",
            }
        );

        expect(res.status).toBe(200);
    });
});
