import { env } from "cloudflare:test";
import app from "@api/app";
import { FINANCIAL_CURRENCIES } from "@shared";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

/**
 * Guards org finance RBAC: students must not mutate org ledger / billing;
 * teachers may read but not mutate; owners retain full access.
 */
describe("Finance authorization", () => {
    let ownerClient: TestClient;
    let studentClient: TestClient;
    let teacherClient: TestClient;
    let orgId: string;
    let fundingAccountId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        orgId = id;
        ownerClient = createTestClient(app, env, cookie);

        const student = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: `student.finance.${Date.now()}@example.com`,
        });
        studentClient = createTestClient(app, env, student.cookie);

        const teacher = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "teacher",
            email: `teacher.finance.${Date.now()}@example.com`,
        });
        teacherClient = createTestClient(app, env, teacher.cookie);

        const activateRes = await ownerClient.orgs.finance.activateCurrency(orgId, {
            currencyId: FINANCIAL_CURRENCIES.USD,
        });
        expect(activateRes.status).toBe(201);
        const activateBody = (await activateRes.json()) as { data: { id: string } };
        fundingAccountId = activateBody.data.id;
    });

    it("student cannot read org finance summary", async () => {
        const res = await studentClient.orgs.finance.getBalance(orgId);
        expect(res.status).toBe(403);
    });

    it("student cannot activate currencies", async () => {
        const res = await studentClient.orgs.finance.activateCurrency(orgId, {
            currencyId: FINANCIAL_CURRENCIES.EUR,
        });
        expect(res.status).toBe(403);
    });

    it("student cannot create billing plans", async () => {
        const res = await studentClient.request(`/api/v1/orgs/${orgId}/finance/billing-plans`, {
            method: "POST",
            body: {
                name: "Hack Plan",
                currencyId: FINANCIAL_CURRENCIES.USD,
                description: null,
                tiers: [{ name: "T1", priceCents: 1000, sessionCount: 1 }],
            },
        });
        expect(res.status).toBe(403);
    });

    it("student cannot transfer org funding accounts", async () => {
        const createRes = await ownerClient.orgs.finance.createAccount(orgId, {
            name: "Payroll",
            currencyId: FINANCIAL_CURRENCIES.USD,
            ownerType: "org",
            ownerId: orgId,
        });
        expect(createRes.status).toBe(201);
        const payroll = ((await createRes.json()) as { data: { id: string } }).data;

        const res = await studentClient.orgs.finance.executeTransfer(orgId, {
            categoryId: "fcat_internal_transfer",
            sourceAccountId: fundingAccountId,
            destinationAccountId: payroll.id,
            currencyId: FINANCIAL_CURRENCIES.USD,
            amountCents: 100,
            description: "student should not move org funds",
        });
        expect(res.status).toBe(403);
    });

    it("teacher can read org finance summary but cannot activate currency", async () => {
        const readRes = await teacherClient.orgs.finance.getBalance(orgId);
        expect(readRes.status).toBe(200);

        const writeRes = await teacherClient.orgs.finance.activateCurrency(orgId, {
            currencyId: FINANCIAL_CURRENCIES.EUR,
        });
        expect(writeRes.status).toBe(403);
    });

    it("owner can still read and mutate org finance", async () => {
        const readRes = await ownerClient.orgs.finance.getBalance(orgId);
        expect(readRes.status).toBe(200);

        const createRes = await ownerClient.orgs.finance.createAccount(orgId, {
            name: `Ops ${Date.now()}`,
            currencyId: FINANCIAL_CURRENCIES.USD,
            ownerType: "org",
            ownerId: orgId,
        });
        expect(createRes.status).toBe(201);
    });
});
