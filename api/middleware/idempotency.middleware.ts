import { ConflictError } from "@api/errors/app.error";
import { getCacheService } from "@api/factories/service.factory";
import type { AppEnv } from "@api/helpers/types.helpers";
import { createMiddleware } from "hono/factory";

const IDEMPOTENCY_HEADER = "Idempotency-Key";

/**
 * Idempotency middleware guards mutating endpoints against double-submission.
 *
 * KV is used as a best-effort cache only. It is NOT the atomic lock.
 * The DB UNIQUE index on (organization_id, idempotency_key) is the true guard.
 * Blocking on 'pending' from KV would create its own TOCTOU race due to KV's
 * eventual consistency — so we skip it. The repository throws ConflictError
 * on constraint violation, which surfaces as 409.
 */
export const idempotencyMiddleware = createMiddleware<AppEnv>(async (ctx, next) => {
    const idempotencyKey = ctx.req.header(IDEMPOTENCY_HEADER);

    // No header — middleware is a no-op.
    if (!idempotencyKey) {
        return next();
    }

    const method = ctx.req.method;
    const path = ctx.req.path;
    const cache = getCacheService(ctx);

    const result = await cache.checkIdempotency(method, path, idempotencyKey);

    // ── Replay cached success ────────────────────────────────────────────────
    if (result.status === "completed") {
        const parsed = JSON.parse(result.cachedResponse);
        ctx.res = ctx.newResponse(result.cachedResponse, {
            status: parsed?.status ?? 200,
            headers: {
                "Content-Type": "application/json",
                "Idempotency-Replayed": "true",
            },
        });
        return;
    }

    // NOTE: We intentionally do NOT block on result.status === 'pending'.
    // KV is eventually consistent; two concurrent requests can both read null
    // before either writes 'pending', making the check ineffective for races.
    // The DB UNIQUE index on idempotency_key is the atomic guard.
    // The repository will throw ConflictError (→ 409) on a duplicate insert.

    await cache.markPending(method, path, idempotencyKey);

    try {
        await next();

        // Capture response body to cache on success
        const responseText = await ctx.res.clone().text();
        await cache.markCompleted(method, path, idempotencyKey, responseText);
    } catch (err) {
        // Clear the sentinel so the client can retry with the same key,
        // except on ConflictError — that means the DB already committed once,
        // so we keep the completed record (set by the winning request) intact.
        if (!(err instanceof ConflictError)) {
            await cache.clearPending(method, path, idempotencyKey);
        }
        throw err;
    }
});
