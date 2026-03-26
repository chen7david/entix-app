import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { UnauthorizedError } from "@api/errors/app.error";
import { auth } from "@api/lib/auth/auth";
import { authUserSchema } from "@shared/schemas/dto/auth.dto";
import type { AppEnv } from "@api/helpers/types.helpers";

/**
 * Validates the user session and populates context variables.
 * Throws 401 if unauthorized or if session shape is invalid.
 */
export async function validateSession(ctx: Context<AppEnv>): Promise<void> {
    const authClient = auth(ctx);
    const session = await authClient.api.getSession({ headers: ctx.req.raw.headers });

    if (!session || !session.user) {
        ctx.var.logger.warn("Unauthorized: No valid session");
        throw new UnauthorizedError("Authentication required");
    }

    const result = authUserSchema.safeParse(session.user);
    if (!result.success) {
        ctx.var.logger.error({ errors: result.error.format() }, "Invalid session user shape");
        throw new UnauthorizedError("Invalid session structure");
    }

    const { id, role } = result.data;
    ctx.set("userId", id);
    ctx.set("isSuperAdmin", role === "admin");
}

/**
 * Hono middleware that validates session for protected routes.
 * Ensures userId is available in context for downstream handlers.
 */
export const requireAuth = createMiddleware<AppEnv>(async (ctx, next) => {
    await validateSession(ctx);
    await next();
});
