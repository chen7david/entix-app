import { DbBatchRunner } from "@api/helpers/batch-runner";
import { PaymentQueueRepository } from "@api/repositories/payment/payment-queue.repository";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    buildMockAccountsRepo,
    buildMockAttendancesRepo,
    buildMockAuditRepo,
    buildMockBillingPlansRepo,
    buildMockTransactionsRepo,
} from "../helpers/mock-repos.helper";
import { createTestDb } from "../helpers/test-db.helper";

describe("SessionPaymentService", () => {
    let db: ReturnType<typeof createTestDb>;
    let paymentRequestsRepo: PaymentQueueRepository;
    let service: SessionPaymentService;

    const sessionId = "ses_test001";
    const userId = "usr_test001";
    const organizationId = "org_test001";

    beforeEach(() => {
        db = createTestDb();
        paymentRequestsRepo = new PaymentQueueRepository(db);
        service = new SessionPaymentService(
            new DbBatchRunner(db),
            buildMockTransactionsRepo(),
            buildMockAttendancesRepo(),
            paymentRequestsRepo,
            buildMockAuditRepo(),
            buildMockAccountsRepo(),
            buildMockBillingPlansRepo()
        );
    });

    describe("processSessionPayment", () => {
        it("inserts a payment_request with correct idempotency key", async () => {
            await service.processSessionPayment({
                sessionId,
                userId,
                organizationId,
                amountCents: 1000,
                currencyId: "fcur_usd",
                sourceAccountId: "acc_src",
                destinationAccountId: "acc_dest",
                categoryId: "fcat_service_fee",
                performedBy: userId,
            });

            const expectedKey = `session_payment:${sessionId}:${userId}`;
            const record = await paymentRequestsRepo.findByIdempotencyKey(expectedKey);

            expect(record).not.toBeNull();
            expect(record?.referenceType).toBe("session");
            expect(record?.referenceId).toBe(sessionId);
            expect(record?.requestedBy).toBe(userId);
            expect(record?.id).toMatch(/^pr_/);
        });

        it("is idempotent — second call does not create a duplicate", async () => {
            const payload = {
                sessionId,
                userId,
                organizationId,
                amountCents: 1000,
                currencyId: "fcur_usd",
                sourceAccountId: "acc_src",
                destinationAccountId: "acc_dest",
                categoryId: "fcat_service_fee",
                performedBy: userId,
            };
            await service.processSessionPayment(payload);
            await service.processSessionPayment(payload);

            const results = await paymentRequestsRepo.listByReference("session", sessionId);
            expect(results).toHaveLength(1);
        });

        it("uses pr_ prefix for the payment request id", async () => {
            await service.processSessionPayment({
                sessionId,
                userId,
                organizationId,
                amountCents: 1000,
                currencyId: "fcur_usd",
                sourceAccountId: "acc_src",
                destinationAccountId: "acc_dest",
                categoryId: "fcat_service_fee",
                performedBy: userId,
            });
            const expectedKey = `session_payment:${sessionId}:${userId}`;
            const record = await paymentRequestsRepo.findByIdempotencyKey(expectedKey);
            expect(record?.id).toMatch(/^pr_/);
        });

        it("allows re-submission after a failure", async () => {
            const payload = {
                sessionId,
                userId,
                organizationId,
                amountCents: 1000,
                currencyId: "fcur_usd",
                sourceAccountId: "acc_src",
                destinationAccountId: "acc_dest",
                categoryId: "fcat_service_fee",
                performedBy: userId,
            };

            // 1. Mock a failure in the transaction layer
            const mockTransactions = buildMockTransactionsRepo();
            mockTransactions.insert = vi.fn().mockRejectedValueOnce(new Error("Simulated failure"));

            const failingService = new SessionPaymentService(
                new DbBatchRunner(db),
                mockTransactions,
                buildMockAttendancesRepo(),
                paymentRequestsRepo,
                buildMockAuditRepo(),
                buildMockAccountsRepo(),
                buildMockBillingPlansRepo()
            );

            // 2. First attempt fails
            await expect(failingService.processSessionPayment(payload)).rejects.toThrow(
                "Simulated failure"
            );

            const expectedKey = `session_payment:${sessionId}:${userId}`;
            let record = await paymentRequestsRepo.findByIdempotencyKey(expectedKey);
            expect(record?.status).toBe("failed");
            expect(record?.failureReason).toBe("Simulated failure");

            // 3. Second attempt succeeds (mock success this time)
            mockTransactions.insert = vi.fn().mockResolvedValueOnce(undefined);
            await failingService.processSessionPayment(payload);

            record = await paymentRequestsRepo.findByIdempotencyKey(expectedKey);
            expect(record?.status).toBe("completed");
        });
    });

    describe("getSessionPaymentRequests", () => {
        it("returns all payment requests for a given session", async () => {
            await service.processSessionPayment({
                sessionId,
                userId,
                organizationId,
                amountCents: 1000,
                currencyId: "fcur_usd",
                sourceAccountId: "acc_src",
                destinationAccountId: "acc_dest",
                categoryId: "fcat_service_fee",
                performedBy: userId,
            });
            const results = await service.getSessionPaymentRequests(sessionId);
            expect(results).toHaveLength(1);
            expect(results[0].referenceId).toBe(sessionId);
        });

        it("returns empty array when no requests exist for a session", async () => {
            const results = await service.getSessionPaymentRequests("ses_nonexistent");
            expect(results).toHaveLength(0);
        });
    });
});
