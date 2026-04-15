/**
 * Abstract KV cache layer.
 *
 * KvCacheRepository is the domain interface — business logic depends on this,
 * never on KVNamespace directly.
 *
 * CloudflareKvCacheRepository is the Cloudflare-specific implementation.
 * Swap it out (e.g. for an in-memory mock in tests) by injecting a different
 * implementation via the factory.
 */

export interface KvCacheRepository {
    /**
     * Retrieve a cached value by key.
     * Returns null if the key does not exist or has expired.
     */
    get(key: string): Promise<string | null>;

    /**
     * Store a value with an optional TTL (seconds).
     * Omitting ttlSeconds stores the value indefinitely (until manual deletion).
     */
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;

    /**
     * Delete a key immediately, regardless of TTL.
     * Safe to call on non-existent keys (no-op).
     */
    delete(key: string): Promise<void>;
}

// ─── Cloudflare KV Implementation ────────────────────────────────────────────

export class CloudflareKvCacheRepository implements KvCacheRepository {
    constructor(private readonly kv: KVNamespace) {}

    async get(key: string): Promise<string | null> {
        return this.kv.get(key, { type: "text" });
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const options = ttlSeconds !== undefined ? { expirationTtl: ttlSeconds } : undefined;
        await this.kv.put(key, value, options);
    }

    async delete(key: string): Promise<void> {
        await this.kv.delete(key);
    }
}
