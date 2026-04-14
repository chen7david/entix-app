import { PaymentRequestsRepository } from "@api/repositories/payment-requests.repository";
import { paymentRequests } from "@shared/db/schema";
import { createTestDb } from "../helpers/test-db.helper";

describe("PaymentRequestsRepository", () => {
    let repo: PaymentRequestsRepository;
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
        repo = new PaymentRequestsRepository(db);
    });

    describe("insert", () => {
        it("inserts and returns a new payment request", async () => {
            const result = await repo.insert(baseRequest);
            expect(result.id).toBe("pr_test001");
            expect(result.status).toBe("pending");
            expect(result.idempotencyKey).toBe("session_payment:ses_test001:usr_test001");
        });
    });

    describe("findByIdempotencyKey", () => {
        it("returns the record when the key exists", async () => {
            await repo.insert(baseRequest);
            const found = await repo.findByIdempotencyKey("session_payment:ses_test001:usr_test001");
            expect(found).not.toBeNull();
            expect(found?.id).toBe("pr_test001");
        });

        it("returns null when the key does not exist", async () => {
            const found = await repo.findByIdempotencyKey("session_payment:nonexistent:usr");
            expect(found).toBeNull();
        });
    });

    describe("findById", () => {
        it("returns the record by primary key", async () => {
            await repo.insert(baseRequest);
            const found = await repo.findById("pr_test001");
            expect(found?.id).toBe("pr_test001");
        });

        it("returns null for an unknown id", async () => {
            const found = await repo.findById("pr_unknown");
            expect(found).toBeNull();
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
            expect(updated.attemptCount).toBe(1);
        });

        it("transitions status to failed and stores failureReason", async () => {
            await repo.insert(baseRequest);
            const updated = await repo.updateStatus("pr_test001", "failed", {
                failureReason: "insufficient_funds",
                attemptCount: 1,
            });
            expect(updated.status).toBe("failed");
            expect(updated.failureReason).toBe("insufficient_funds");
        });
    });

    describe("listByReference", () => {
        it("returns all requests matching referenceType and referenceId", async () => {
            await repo.insert(baseRequest);
            await repo.insert({
                ...baseRequest,
                id: "pr_test002",
                idempotencyKey: "session_payment:ses_test001:usr_test002",
                requestedBy: "usr_test002",
            });
            const results = await repo.listByReference("session", "ses_test001");
            expect(results).toHaveLength(2);
        });

        it("returns empty array when no matches", async () => {
            const results = await repo.listByReference("session", "ses_nonexistent");
            expect(results).toHaveLength(0);
        });
    });

    describe("listByOrganization", () => {
        it("returns all requests for an organization", async () => {
            await repo.insert(baseRequest);
            const results = await repo.listByOrganization("org_test001");
            expect(results).toHaveLength(1);
        });

        it("filters by status when provided", async () => {
            await repo.insert(baseRequest);
            await repo.updateStatus("pr_test001", "completed");
            const pending = await repo.listByOrganization("org_test001", "pending");
            const completed = await repo.listByOrganization("org_test001", "completed");
            expect(pending).toHaveLength(0);
            expect(completed).toHaveLength(1);
        });
    });
});
