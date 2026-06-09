/**
 * Seed org id from `0001_genesis_seed.sql` — same value in every deploy (not env-specific).
 * Used for platform-scoped audit events and global vocabulary bank upload rows.
 */
export const PLATFORM_ORGANIZATION_ID = "platform";
