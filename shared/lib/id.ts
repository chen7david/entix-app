/**
 * Central ID helpers for the **shared** package. Safe for web + api + future monorepo workers:
 * do not import from `api/` here.
 */
import { nanoid } from "nanoid";

/**
 * Default nanoid length (~149 bits entropy). Used for all prefixed and opaque primary keys.
 */
const NANOID_SIZE = 21;

/**
 * Generates a prefixed ID: `{prefix}_{nanoid}`.
 * Use typed helpers (`generateAccountId`, etc.) in application code when available.
 */
export function generateId(prefix: string): string {
    return `${prefix}_${nanoid(NANOID_SIZE)}`;
}

/**
 * Unprefixed primary key (21-char nanoid). Used for entities that historically stored raw nanoids:
 * `auth_users`, `auth_organizations`, `auth_members`, `scheduled_sessions`, `financial_org_settings`, etc.
 *
 * Prefer a **typed** `generateXxxId` when the domain has a stable prefix (ledger, billing, audit).
 */
export const generateOpaqueId = () => nanoid(NANOID_SIZE);

/**
 * Long random string for dummy passwords and other non-entity secrets (not a row primary key).
 */
export const generateSecretToken = () => nanoid(32);

/**
 * Short random uppercase string (e.g. auth `xid` in tests). Not used for primary keys.
 */
export const generateShortUpperToken = (length = 8) => nanoid(length).toUpperCase();

// ─── Financial & ledger (prefixed) ─────────────────────────────────────────

export const generateAccountId = () => generateId("facc");
export const generateCurrencyId = () => generateId("fcur");
export const generateCategoryId = () => generateId("fcat");
/** Ledger transaction header (`financial_transactions.id`). */
export const generateTransactionId = () => generateId("tx");
/** Ledger transaction line (`financial_transaction_lines.id`). */
export const generateTransactionLineId = () => generateId("txl");
export const generateBillingPlanId = () => generateId("fbp");
export const generateMemberBillingPlanId = () => generateId("fmbp");
export const generateBillingPlanRateId = () => generateId("fbpr");
export const generatePaymentRequestId = () => generateId("pr");
export const generateAuditId = () => generateId("aud");

// ─── Media (defaults match Drizzle `$defaultFn` on `media.id`) ───────────────

/** Same entropy as {@link generateOpaqueId}; used by `media` table default. */
export const generateMediaId = generateOpaqueId;
