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
    if (!prefix || prefix.trim().length === 0) {
        throw new Error("generateId: prefix must not be empty");
    }
    return `${prefix}_${nanoid(NANOID_SIZE)}`;
}

// Entity-specific typed generators
export const generateAccountId = () => generateId("facc");
export const generateCurrencyId = () => generateId("fcur");
export const generateCategoryId = () => generateId("fcat");
export const generateTransactionId = () => generateId("ftxn");
export const generateTransactionLineId = () => generateId("flne");
