/**
 * Calculates the charge for a class session in whole cents.
 * Math.round is neutral — does not favour org or student on fractional cents.
 * Applied once at calculation time so amount_cents in DB is always a clean integer.
 * Scope: class billing only. Do NOT reuse for products or subscriptions.
 */
export function calculateClassChargeCents(
    rateCentsPerMinute: number,
    durationMinutes: number,
    participantCount: number
): number {
    return Math.round(rateCentsPerMinute * durationMinutes * participantCount);
}

/**
 * Resolves the effective overdraft limit for an account.
 * Logic:
 * 1. If account.overdraftLimitCents > 0, use the account override.
 * 2. If account.overdraftLimitCents === 0, defer to billingPlan.overdraftLimitCents.
 * 3. Fallback to 0 if no plan or plan is also 0.
 *
 * All limits are stored as positive magnitudes.
 */
export function resolveOverdraftLimit(
    account: { overdraftLimitCents: number },
    billingPlan?: { overdraftLimitCents: number } | null
): number {
    if (account.overdraftLimitCents === 0) {
        return billingPlan?.overdraftLimitCents ?? 0;
    }
    return account.overdraftLimitCents;
}
