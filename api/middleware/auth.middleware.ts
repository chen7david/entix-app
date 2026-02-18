import { UnauthorizedError } from "@api/errors/app.error";
import { auth } from "@api/lib/auth/auth";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";

/**
 * Validates the user session and returns the user ID
 * Throws 401 if unauthorized
 */
export async function validateSession(c: AppContext): Promise<string> {
    const authClient = auth(c);
    const session = await authClient.api.getSession({ headers: c.req.raw.headers });

    if (!session || !session.user) {
        c.var.logger.warn("Unauthorized: No valid session");
        throw new UnauthorizedError("Authentication required");
    }

    // Set userId in context if needed, but returning it is safer for direct usage
    c.set("userId", session.user.id);
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
export const requireAuth = async (c: AppContext, next: Next) => {
    const userId = await validateSession(c);
    c.set("userId", userId);
    await next();
};
