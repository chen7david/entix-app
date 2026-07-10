import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppContext } from "@api/helpers/types.helpers";
import { HTTPException } from "hono/http-exception";

/**
 * Validates the X-Internal-Secret header against the environment's INTERNAL_SECRET.
 * Used for secure communication between the Queue worker and the Hono API.
 */
export async function requireInternalSecret(ctx: AppContext, next: () => Promise<void>) {
    const secret = ctx.req.header("X-Internal-Secret");
    const expected = ctx.env.INTERNAL_SECRET;

    if (!expected) {
        throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
            message: "Server misconfiguration: INTERNAL_SECRET is missing",
        });
    }

    const secretBytes = new TextEncoder().encode(secret || "");
    const expectedBytes = new TextEncoder().encode(expected);

    if (secretBytes.length !== expectedBytes.length) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
            message: "Invalid or missing internal secret",
        });
    }

    const isValid = await crypto.subtle.timingSafeEqual(secretBytes, expectedBytes);
    if (!isValid) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
            message: "Invalid or missing internal secret",
        });
    }

    await next();
}
