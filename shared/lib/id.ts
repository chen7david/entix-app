import { nanoid } from "nanoid";

/**
 * Generates a prefixed ID using nanoid.
 * @param prefix The prefix for the ID (e.g., 'facc', 'fcur')
 * @returns A string in the format prefix_nanoid
 */
export function generateId(prefix: string): string {
    return `${prefix}_${nanoid()}`;
}
