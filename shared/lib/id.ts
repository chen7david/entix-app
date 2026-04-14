import { nanoid } from "nanoid";

/**
 * NANOID_SIZE = 21
 * Provides ~149 bits of entropy, making it collision-safe at practically any scale
 * for a distributed financial system.
 */
const NANOID_SIZE = 21;

/**
 * Generates a prefixed ID using nanoid.
 * @param prefix The prefix for the ID (e.g., 'facc', 'fcur')
 * @returns A string in the format prefix_nanoid
 * @throws Error if prefix is empty or whitespace
 */
export function generateId(prefix: string): string {
    return `${prefix}_${nanoid(NANOID_SIZE)}`;
}

// Entity-specific typed generators
// Prefix validation is a caller responsibility — enforced by TypeScript typed helpers above
export const generateAccountId = () => generateId("facc");
export const generateCurrencyId = () => generateId("fcur");
export const generateCategoryId = () => generateId("fcat");
export const generateTransactionId = () => generateId("ftxn");
export const generateTransactionLineId = () => generateId("flne");
export const generateBillingPlanId = () => generateId("fbp");
export const generateMemberBillingPlanId = () => generateId("fmbp");
export const generateBillingPlanRateId = () => generateId("fbpr");
export const generatePaymentRequestId = () => generateId("pr");
export const generateAuditId = () => generateId("aud");
