/**
 * Calculates the total charge for a session based on rate and duration.
 */
export function calculateClassChargeCents(
    rateCentsPerMinute: number,
    durationMinutes: number
): number {
    return rateCentsPerMinute * durationMinutes;
}

/**
 * Resolves the effective overdraft limit for an account.
 * Account-level limit takes precedence over the billing plan's default.
 * Falls back to 0 (no overdraft) if neither is set.
 */
export function resolveOverdraftLimit(
    account: { overdraftLimitCents?: number | null },
    plan: { overdraftLimitCents?: number | null } | null | undefined
): number {
    if (account.overdraftLimitCents != null) return account.overdraftLimitCents;
    return plan?.overdraftLimitCents ?? 0;
}
