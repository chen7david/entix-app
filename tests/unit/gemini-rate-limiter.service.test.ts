import { GEMINI_MAX_REQUESTS_PER_MINUTE } from "@api/constants/ai.constants";
import type { KvCacheRepository } from "@api/repositories/kv-cache.repository";
import { GeminiRateLimiter } from "@api/services/gemini-rate-limiter.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class MemoryKv implements KvCacheRepository {
    private store = new Map<string, string>();

    async get(key: string): Promise<string | null> {
        return this.store.get(key) ?? null;
    }

    async set(key: string, value: string): Promise<void> {
        this.store.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }
}

describe("GeminiRateLimiter", () => {
    let kv: MemoryKv;
    let limiter: GeminiRateLimiter;

    beforeEach(() => {
        kv = new MemoryKv();
        limiter = new GeminiRateLimiter(kv, 3);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("allows up to maxRequestsPerMinute acquires in a rolling window", async () => {
        await limiter.acquire();
        await limiter.acquire();
        await limiter.acquire();

        const pending = limiter.acquire();
        vi.advanceTimersByTimeAsync(65_000);
        await expect(pending).resolves.toBeUndefined();
    });

    it("throws TooManyRequestsError with retryAfterMs when the window stays full", async () => {
        const alwaysFullKv: KvCacheRepository = {
            async get() {
                const t = Date.now();
                return JSON.stringify([t, t - 1_000, t - 2_000]);
            },
            async set() {},
            async delete() {},
        };
        limiter = new GeminiRateLimiter(alwaysFullKv, 3);

        const pending = limiter.acquire();
        const expectation = expect(pending).rejects.toMatchObject({
            details: { source: "gemini_rate_limiter", retryAfterMs: expect.any(Number) },
        });
        await vi.advanceTimersByTimeAsync(65_000);
        await expectation;
    });

    it("exports the configured global RPM constant", () => {
        expect(GEMINI_MAX_REQUESTS_PER_MINUTE).toBe(10);
    });
});
