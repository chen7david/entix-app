import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/test-db.helper";

describe("PaymentQueueRepository", () => {
    let repo: PaymentQueueRepository;
    let db: ReturnType<typeof createTestDb>;

    const baseRequest = {
        id: "pr_test001",
        organizationId: "org_test001",
        type: "session_payment" as const,
        status: "pending" as const,
        amountCents: 5000,
        currencyId: "cur_usd",
        sourceAccountId: "acc_member001",
        destinationAccountId: "acc_org001",
        categoryId: "cat_session",
        idempotencyKey: "session_payment:ses_test001:usr_test001",
        referenceType: "session",
        referenceId: "ses_test001",
        requestedBy: "usr_test001",
        attemptCount: 0,
    };

    beforeEach(() => {
        db = createTestDb();
        repo = new PaymentQueueRepository(db);
    });

    describe("enqueue", () => {
        it("inserts and returns a new payment request when key is unique", async () => {
            const result = await repo.enqueue(baseRequest);
            expect(result).not.toBeNull();
            expect(result?.id).toBe("pr_test001");
        });

        it("returns null on idempotency key collision", async () => {
            await repo.enqueue(baseRequest);
            const result = await repo.enqueue({
                ...baseRequest,
                id: "pr_test002", // Different ID, same idempotency key
            });
            expect(result).toBeNull();
        });
    });

    describe("insert", () => {
        it("inserts and returns a new payment request", async () => {
            const result = await repo.insert(baseRequest);
            expect(result.id).toBe("pr_test001");
            expect(result.status).toBe("pending");
        });
    });

    describe("findById", () => {
        it("returns the record by primary key", async () => {
            await repo.insert(baseRequest);
            const found = await repo.findById("pr_test001");
            expect(found?.id).toBe("pr_test001");
        });
    });

    describe("updateStatus", () => {
        it("transitions status to completed and stores transactionId", async () => {
            await repo.insert(baseRequest);
            const updated = await repo.updateStatus("pr_test001", "completed", {
                transactionId: "tx_001",
                attemptCount: 1,
            });
            expect(updated.status).toBe("completed");
            expect(updated.transactionId).toBe("tx_001");
        });
    });

    describe("findPendingOlderThan", () => {
        it("returns only pending requests created before the cutoff", async () => {
            const now = Date.now();
            await repo.insert({ ...baseRequest, id: "pr_old", createdAt: new Date(now - 10000) });
            await repo.insert({
                ...baseRequest,
                id: "pr_new",
                createdAt: new Date(now),
                idempotencyKey: "new",
            });
            await repo.insert({
                ...baseRequest,
                id: "pr_completed",
                status: "completed",
                createdAt: new Date(now - 10000),
                idempotencyKey: "completed",
            });

            const cutoff = new Date(now - 5000);
            const results = await repo.findPendingOlderThan(cutoff);

            expect(results).toHaveLength(1);
            expect(results[0].id).toBe("pr_old");
        });
    });

    describe("listByReference", () => {
        it("returns all requests matching referenceType and referenceId", async () => {
            await repo.insert(baseRequest);
            const results = await repo.listByReference("session", "ses_test001");
            expect(results).toHaveLength(1);
        });
    });

    describe("listByOrganization", () => {
        it("returns all requests for an organization", async () => {
            await repo.insert(baseRequest);
            const results = await repo.listByOrganization("org_test001");
            expect(results).toHaveLength(1);
        });
    });
});
