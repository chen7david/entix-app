import { DbBatchRunner } from "@api/helpers/batch-runner";
import { PaymentRequestsRepository } from "@api/repositories/payment-requests.repository";
import { SessionPaymentService } from "@api/services/financial/session-payment.service";
import { createTestDb } from "../helpers/test-db.helper";
import {
    buildMockAccountsRepo,
    buildMockAttendancesRepo,
    buildMockAuditRepo,
    buildMockBillingPlansRepo,
    buildMockTransactionsRepo,
} from "../helpers/mock-repos.helper";

/**
 * Regression suite: ensures the overdraft balance check is not corrupted
 * when a payment_request is inserted as part of the session payment batch.
 *
 * Previously the SPE insert in phase 3 mutated account balance state
 * before the overdraft guard ran. This test pins the correct execution order.
 */
describe("SessionPaymentService — overdraft regression (EN-312)", () => {
    let db: ReturnType<typeof createTestDb>;
    let paymentRequestsRepo: PaymentRequestsRepository;
    let service: SessionPaymentService;

    const sessionId = "ses_overdraft_test";
    const userId = "usr_test001";
    const organizationId = "org_test001";

    beforeEach(() => {
        db = createTestDb();
        paymentRequestsRepo = new PaymentRequestsRepository(db);
        service = new SessionPaymentService(
            new DbBatchRunner(db),
            buildMockTransactionsRepo(),
            buildMockAttendancesRepo(),
            paymentRequestsRepo,
            buildMockAuditRepo(),
            buildMockAccountsRepo({ balanceCents: 0, overdraftLimitCents: 0 }),
            buildMockBillingPlansRepo()
        );
    });

    it("throws ConflictError when member balance is at overdraft limit", async () => {
        await expect(
            service.processSessionPayment({ sessionId, userId, organizationId })
        ).rejects.toThrow("overdraft");
    });

    it("does not persist a payment_request when the overdraft guard fires", async () => {
        try {
            await service.processSessionPayment({ sessionId, userId, organizationId });
        } catch {
            // expected
        }
        const results = await paymentRequestsRepo.listByReference("session", sessionId);
        expect(results).toHaveLength(0);
    });
});
