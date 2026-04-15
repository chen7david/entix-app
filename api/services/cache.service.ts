import { KvCacheKeys } from "@api/repositories/kv-cache.keys";
import type { KvCacheRepository } from "@api/repositories/kv-cache.repository";

/** Sentinel stored in KV while a request is in-flight. */
const PENDING_SENTINEL = "PENDING" as const;

/**
 * TTLs used by CacheService.
 * Centralised here so changes don't require hunting through middleware.
 */
export const CACHE_TTLS = {
    /** How long an idempotency key result is retained after completion (24 h). */
    IDEMPOTENCY_RESULT_SECONDS: 60 * 60 * 24,
    /**
     * Maximum time a PENDING sentinel is held.
     * Must be longer than the slowest legitimate transaction (120 s is generous for D1).
     * If a Worker crashes mid-flight the sentinel auto-expires, unblocking retries.
     */
    IDEMPOTENCY_PENDING_SECONDS: 120,
} as const;

export type IdempotencyCheckResult =
    | { status: "new" }
    | { status: "pending" }
    | { status: "completed"; cachedResponse: string };

export class CacheService {
    constructor(private readonly kvRepo: KvCacheRepository) {}

    /**
     * Three-state idempotency check:
     *
     *   "new"       → key has never been seen; caller should proceed.
     *   "pending"   → a concurrent request is in-flight; caller should 409.
     *   "completed" → a prior request succeeded; caller should replay the cached response.
     */
    async checkIdempotency(
        method: string,
        path: string,
        idempotencyKey: string
    ): Promise<IdempotencyCheckResult> {
        const key = KvCacheKeys.idempotency(method, path, idempotencyKey);
        const existing = await this.kvRepo.get(key);

        if (existing === null) return { status: "new" };
        if (existing === PENDING_SENTINEL) return { status: "pending" };
        return { status: "completed", cachedResponse: existing };
    }

    /**
     * Mark a key as in-flight (PENDING).
     * Called immediately before the business logic executes.
     */
    async markPending(method: string, path: string, idempotencyKey: string): Promise<void> {
        const key = KvCacheKeys.idempotency(method, path, idempotencyKey);
        await this.kvRepo.set(key, PENDING_SENTINEL, CACHE_TTLS.IDEMPOTENCY_PENDING_SECONDS);
    }

    /**
     * Replace the PENDING sentinel with the final serialised response body.
     * Called after the business logic succeeds.
     */
    async markCompleted(
        method: string,
        path: string,
        idempotencyKey: string,
        responseBody: string
    ): Promise<void> {
        const key = KvCacheKeys.idempotency(method, path, idempotencyKey);
        await this.kvRepo.set(key, responseBody, CACHE_TTLS.IDEMPOTENCY_RESULT_SECONDS);
    }

    /**
     * Delete a pending sentinel — used in error recovery when the handler throws
     * so that clients can retry with the same key rather than waiting for TTL expiry.
     */
    async clearPending(method: string, path: string, idempotencyKey: string): Promise<void> {
        const key = KvCacheKeys.idempotency(method, path, idempotencyKey);
        await this.kvRepo.delete(key);
    }
}
