/**
 * Centralized KV key construction.
 * All keys follow the pattern: <namespace>:<discriminator>:<value>
 * This file is the single source of truth for KV key shape.
 */

export const KvCacheKeys = {
    /**
     * Idempotency key for a specific route + client-supplied key.
     * Format: "idempotency:<method>:<path>:<key>"
     *
     * Example: "idempotency:POST:/api/admin/finance/orgs/org_x/credit:my-key-123"
     */
    idempotency: (method: string, path: string, key: string): string =>
        `idempotency:${method}:${path}:${key}`,
} as const;
