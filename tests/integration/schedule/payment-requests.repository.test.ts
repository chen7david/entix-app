import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCIES } from "@shared";
import {
    authOrganizations,
    authUsers,
    financialAccounts,
    financialTransactions,
    lessons,
    scheduledSessions,
} from "@shared/db/schema";
import { beforeEach, describe, expect, it } from "vitest";
import type { TestDb } from "../../lib/utils";
import { createTestDb } from "../../lib/utils";

describe("PaymentRequestsRepository Integration", () => {
    let db: TestDb;
    let repo: PaymentQueueRepository;
    const orgId = "org_pay_req";
    const sessionId = "sess_pay_req";
    const userId = "user_pay_req";
    const lessonId = "lesson_pay_req";

    beforeEach(async () => {
        db = await createTestDb();
        repo = new PaymentQueueRepository(db);

        // Setup prerequisites
        await db
            .insert(authOrganizations)
            .values({
                id: orgId,
                name: "Pay Request Org",
                slug: "pay-request-org",
                createdAt: new Date(),
            })
            .onConflictDoNothing();

        await db
            .insert(authUsers)
            .values({
                id: userId,
                name: "Pay Request User",
                email: "pay_req@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoNothing();

        await db
            .insert(lessons)
            .values({
                id: lessonId,
                organizationId: orgId,
                title: "Payments Lesson",
            })
            .onConflictDoNothing();

        await db
            .insert(scheduledSessions)
            .values({
                id: sessionId,
                organizationId: orgId,
                lessonId,
                teacherId: userId,
                title: "Pay Request Session",
                startTime: new Date(),
                durationMinutes: 60,
            })
            .onConflictDoNothing();

        // Seed Accounts
        await db
            .insert(financialAccounts)
            .values({
                id: "acc_src",
                organizationId: orgId,
                name: "Source Account",
                ownerId: userId,
                ownerType: "user",
                currencyId: FINANCIAL_CURRENCIES.USD,
                balanceCents: 5000,
                isActive: true,
            })
            .onConflictDoNothing();

        await db
            .insert(financialAccounts)
            .values({
                id: "acc_dest",
                organizationId: orgId,
                name: "Dest Account",
                ownerId: orgId,
                ownerType: "org",
                currencyId: FINANCIAL_CURRENCIES.USD,
                balanceCents: 0,
                isActive: true,
            })
            .onConflictDoNothing();
    });

    it("should insert and list payment requests", async () => {
        await repo.insert({
            id: "pr_1",
            organizationId: orgId,
            type: "session_payment",
            status: "pending",
            amountCents: 1000,
            currencyId: FINANCIAL_CURRENCIES.USD,
            sourceAccountId: "acc_src",
            destinationAccountId: "acc_dest",
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            idempotencyKey: `session_payment:${sessionId}:${userId}`,
            referenceType: "session",
            referenceId: sessionId,
            requestedBy: userId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const list = await repo.listByReference("session", sessionId);
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe("pr_1");
        expect(list[0].amountCents).toBe(1000);
    });

    it("scopes idempotency keys per organization (same key allowed across orgs)", async () => {
        const orgIdB = "org_pay_req_b";
        await db
            .insert(authOrganizations)
            .values({
                id: orgIdB,
                name: "Pay Request Org B",
                slug: "pay-request-org-b",
                createdAt: new Date(),
            })
            .onConflictDoNothing();

        await db
            .insert(financialAccounts)
            .values({
                id: "acc_src_b",
                organizationId: orgIdB,
                name: "Source Account B",
                ownerId: userId,
                ownerType: "user",
                currencyId: FINANCIAL_CURRENCIES.USD,
                balanceCents: 5000,
                isActive: true,
            })
            .onConflictDoNothing();

        await db
            .insert(financialAccounts)
            .values({
                id: "acc_dest_b",
                organizationId: orgIdB,
                name: "Dest Account B",
                ownerId: orgIdB,
                ownerType: "org",
                currencyId: FINANCIAL_CURRENCIES.USD,
                balanceCents: 0,
                isActive: true,
            })
            .onConflictDoNothing();

        const sharedKey = `session_payment:${sessionId}:same_student`;

        await repo.insert({
            id: "pr_org_a",
            organizationId: orgId,
            type: "session_payment",
            status: "pending",
            amountCents: 1000,
            currencyId: FINANCIAL_CURRENCIES.USD,
            sourceAccountId: "acc_src",
            destinationAccountId: "acc_dest",
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            idempotencyKey: sharedKey,
            referenceType: "session",
            referenceId: sessionId,
            requestedBy: userId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await repo.insert({
            id: "pr_org_b",
            organizationId: orgIdB,
            type: "session_payment",
            status: "pending",
            amountCents: 1000,
            currencyId: FINANCIAL_CURRENCIES.USD,
            sourceAccountId: "acc_src_b",
            destinationAccountId: "acc_dest_b",
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            idempotencyKey: sharedKey,
            referenceType: "session",
            referenceId: sessionId,
            requestedBy: userId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const rowA = await repo.findByOrganizationAndIdempotencyKey(orgId, sharedKey);
        const rowB = await repo.findByOrganizationAndIdempotencyKey(orgIdB, sharedKey);
        expect(rowA?.id).toBe("pr_org_a");
        expect(rowB?.id).toBe("pr_org_b");
    });

    it("should find a request by idempotency key", async () => {
        const key = `session_payment:${sessionId}:find_test`;
        await repo.insert({
            id: "pr_find_test",
            organizationId: orgId,
            type: "session_payment",
            status: "pending",
            amountCents: 2000,
            currencyId: FINANCIAL_CURRENCIES.USD,
            sourceAccountId: "acc_src",
            destinationAccountId: "acc_dest",
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            idempotencyKey: key,
            referenceType: "session",
            referenceId: sessionId,
            requestedBy: userId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const found = await repo.findByOrganizationAndIdempotencyKey(orgId, key);
        expect(found).not.toBeNull();
        expect(found?.id).toBe("pr_find_test");
    });

    it("should update status", async () => {
        await repo.insert({
            id: "pr_upd_test",
            organizationId: orgId,
            type: "session_payment",
            status: "pending",
            amountCents: 3000,
            currencyId: FINANCIAL_CURRENCIES.USD,
            sourceAccountId: "acc_src",
            destinationAccountId: "acc_dest",
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            idempotencyKey: "pr_upd_test_key",
            referenceType: "session",
            referenceId: sessionId,
            requestedBy: userId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const txId = "tx_upd_test";
        await db.insert(financialTransactions).values({
            id: txId,
            organizationId: orgId,
            amountCents: 3000,
            currencyId: FINANCIAL_CURRENCIES.USD,
            sourceAccountId: "acc_src",
            destinationAccountId: "acc_dest",
            categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
            transactionDate: new Date(),
            createdAt: new Date(),
        });

        const updated = await repo.updateStatus("pr_upd_test", "completed", {
            transactionId: txId,
            processedAt: new Date(),
        });

        expect(updated.status).toBe("completed");
        expect(updated.transactionId).toBe("tx_upd_test");
    });
});
