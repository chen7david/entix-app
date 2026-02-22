import { UnauthorizedError } from "@api/errors/app.error";
import { auth } from "@api/lib/auth/auth";
import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";

/**
 * Validates the user session and returns the user ID
 * Throws 401 if unauthorized
 */
export async function validateSession(ctx: AppContext): Promise<string> {
    const authClient = auth(ctx);
    const session = await authClient.api.getSession({ headers: ctx.req.raw.headers });

    if (!session || !session.user) {
        ctx.var.logger.warn("Unauthorized: No valid session");
        throw new UnauthorizedError("Authentication required");
    }

    ctx.set("userId", session.user.id);
    ctx.set("isSuperAdmin", session.user.role === "admin");
    return session.user.id;
}

/**
 * Hono middleware that validates session for protected routes
 * Sets userId in context for downstream handlers to use
 * 
 * Usage:
 * ```typescript
 * export const protectedRoutes = createRouter()
 *     .use(requireAuth)  // Apply to all routes in this router
 *     .openapi(MyRoutes.endpoint, MyHandler.endpoint);
 * ```
 */
export const requireAuth = async (ctx: AppContext, next: Next) => {
    await validateSession(ctx);
    await next();
};
