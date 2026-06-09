/** Normalize Drizzle `timestamp_ms` values (Date or epoch ms) for JSON responses. */
export const toMs = (v: number | Date): number => (v instanceof Date ? v.getTime() : v);
