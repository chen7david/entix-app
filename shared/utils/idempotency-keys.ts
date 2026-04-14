/**
 * Asserts that a value is non-empty and non-whitespace.
 * Throws a descriptive error if validation fails.
 */
function assertNonEmpty(value: string | undefined | null, label: string): string {
    if (!value?.trim()) {
        throw new Error(`IdempotencyKey: ${label} must not be empty`);
    }
    return value;
}

/**
 * Factory for creating consistent, type-safe idempotency keys across the system.
 *
 * DESIGN:
 * - One source of truth for all key formats.
 * - TypeScript enforces required arguments.
 * - Runtime non-empty validation prevents silent deduplication failures.
 */
export const IdempotencyKeys = {
    sessionPayment: (sessionId: string, userId: string) => {
        assertNonEmpty(sessionId, "sessionId");
        assertNonEmpty(userId, "userId");
        return `session_payment:${sessionId}:${userId}`;
    },

    refund: (originalTransactionId: string) => {
        assertNonEmpty(originalTransactionId, "originalTransactionId");
        return `refund:${originalTransactionId}`;
    },

    walletTopup: (userId: string, requestId: string) => {
        assertNonEmpty(userId, "userId");
        assertNonEmpty(requestId, "requestId");
        return `topup:${userId}:${requestId}`;
    },

    billingCharge: (organizationId: string, period: string) => {
        assertNonEmpty(organizationId, "organizationId");
        assertNonEmpty(period, "period");
        return `billing:${organizationId}:${period}`;
    },
} as const;
