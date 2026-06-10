import { GEMINI_MAX_REQUESTS_PER_MINUTE } from "@api/constants/ai.constants";
import { TooManyRequestsError } from "@api/errors/app.error";
import { KvCacheKeys } from "@api/repositories/kv-cache.keys";
import type { KvCacheRepository } from "@api/repositories/kv-cache.repository";

const WINDOW_MS = 60_000;
/** KV TTL — longer than the window so sliding state survives minute boundaries. */
const KV_TTL_SECONDS = 120;
/** Max in-process wait before deferring to the caller (queue retry / HTTP 429). */
const MAX_WAIT_MS = 65_000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GeminiRateLimitDefer = {
    retryAfterMs: number;
    source: "gemini_rate_limiter";
};

/**
 * Distributed sliding-window limiter for Gemini `generateContent` calls.
 * Every attempt — including Cloudflare Queue retries — must call {@link acquire} first.
 */
export class GeminiRateLimiter {
    constructor(
        private readonly kv: KvCacheRepository,
        private readonly maxRequestsPerMinute = GEMINI_MAX_REQUESTS_PER_MINUTE
    ) {}

    /**
     * Reserve a slot, waiting in-process when briefly over the cap.
     * Throws {@link TooManyRequestsError} with `retryAfterMs` when the wait would exceed {@link MAX_WAIT_MS}.
     */
    async acquire(): Promise<void> {
        const deadline = Date.now() + MAX_WAIT_MS;

        while (Date.now() < deadline) {
            const attempt = await this.tryAcquire();
            if (attempt.ok) return;

            const remaining = deadline - Date.now();
            if (remaining <= 0) break;

            await sleep(Math.min(attempt.retryAfterMs, remaining));
        }

        const retryAfterMs = await this.retryAfterMs();
        throw new TooManyRequestsError(
            `Gemini rate limit: max ${this.maxRequestsPerMinute} generateContent requests per minute`,
            { retryAfterMs, source: "gemini_rate_limiter" } satisfies GeminiRateLimitDefer
        );
    }

    private async tryAcquire(): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
        const now = Date.now();
        const key = KvCacheKeys.geminiGenerateRpm();
        const raw = await this.kv.get(key);
        let timestamps: number[] = [];

        if (raw) {
            try {
                const parsed: unknown = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    timestamps = parsed.filter((t): t is number => typeof t === "number");
                }
            } catch {
                timestamps = [];
            }
        }

        timestamps = timestamps.filter((t) => now - t < WINDOW_MS).sort((a, b) => a - b);

        if (timestamps.length >= this.maxRequestsPerMinute) {
            const [oldest] = timestamps;
            if (oldest === undefined) {
                return { ok: true };
            }
            const retryAfterMs = Math.max(WINDOW_MS - (now - oldest) + 50, 50);
            return { ok: false, retryAfterMs };
        }

        timestamps.push(now);
        await this.kv.set(key, JSON.stringify(timestamps), KV_TTL_SECONDS);
        return { ok: true };
    }

    private async retryAfterMs(): Promise<number> {
        const now = Date.now();
        const raw = await this.kv.get(KvCacheKeys.geminiGenerateRpm());
        if (!raw) return WINDOW_MS;

        try {
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) return WINDOW_MS;
            const timestamps = parsed
                .filter((t): t is number => typeof t === "number")
                .filter((t) => now - t < WINDOW_MS)
                .sort((a, b) => a - b);
            if (timestamps.length < this.maxRequestsPerMinute) return 50;
            const [oldest] = timestamps;
            if (oldest === undefined) return WINDOW_MS;
            return Math.max(WINDOW_MS - (now - oldest) + 50, 50);
        } catch {
            return WINDOW_MS;
        }
    }
}

export function geminiRateLimitRetryAfterMs(error: unknown): number | null {
    if (!(error instanceof TooManyRequestsError)) return null;
    const details = error.details;
    if (typeof details !== "object" || details === null || !("retryAfterMs" in details)) {
        return null;
    }
    const retryAfterMs = (details as GeminiRateLimitDefer).retryAfterMs;
    return typeof retryAfterMs === "number" && retryAfterMs > 0 ? retryAfterMs : null;
}

/** Defer a queue message when the Gemini RPM limiter could not acquire a slot in-process. */
export function retryQueueMessageOnGeminiRateLimit(
    message: Message<unknown>,
    error: unknown
): boolean {
    const retryAfterMs = geminiRateLimitRetryAfterMs(error);
    if (retryAfterMs === null) return false;
    const delaySeconds = Math.min(Math.max(Math.ceil(retryAfterMs / 1000), 1), 900);
    message.retry({ delaySeconds });
    return true;
}
