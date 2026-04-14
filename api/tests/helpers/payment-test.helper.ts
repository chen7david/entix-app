import type { EnqueuePaymentInput } from "@api/services/payment/payment-queue.service";
import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCIES } from "@shared";
import type { PaymentRequest } from "@shared/db/schema";

/**
 * Factory for creating mock PaymentRequest objects for testing.
 * Prevents test bloat by providing sensible defaults for financial payloads.
 */
export const createMockPaymentRequest = (overrides?: Partial<PaymentRequest>): PaymentRequest => {
    return {
        id: "pr_mock_123",
        organizationId: "org_mock_123",
        type: "session_payment",
        status: "pending",
        amountCents: 1000,
        currencyId: FINANCIAL_CURRENCIES.CNY,
        sourceAccountId: "acc_src_123",
        destinationAccountId: "acc_dest_123",
        categoryId: FINANCIAL_CATEGORIES.SERVICE_FEE,
        idempotencyKey: "mock_key_123",
        referenceType: "session",
        referenceId: "ses_mock_123",
        requestedBy: null,
        userId: "usr_mock_123",
        processedAt: null,
        transactionId: null,
        failureReason: null,
        lastAttemptedAt: null,
        attemptCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as PaymentRequest;
};

/**
 * Factory for creating mock EnqueuePaymentInput objects for testing.
 */
export const createEnqueueInput = (
    overrides?: Partial<EnqueuePaymentInput>
): EnqueuePaymentInput => {
    return {
        organizationId: "org_mock_123",
        type: "session_payment",
        amountCents: 1000,
        currencyId: FINANCIAL_CURRENCIES.CNY,
        sourceAccountId: "acc_src_123",
        destinationAccountId: "acc_dest_123",
        categoryId: FINANCIAL_CATEGORIES.SERVICE_FEE,
        idempotencyKey: "mock_key_123",
        referenceType: "session",
        referenceId: "ses_mock_123",
        requestedBy: null,
        userId: "usr_mock_123",
        note: "Mock payment note",
        ...overrides,
    };
};
