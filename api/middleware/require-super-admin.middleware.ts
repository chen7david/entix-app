import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";
import { ForbiddenError } from "@api/errors/app.error";

/**
 * Middleware that restricts a route to super admins (platform-level admins) only.
 *
 * Must be used AFTER requireAuth middleware, which sets `isSuperAdmin` in context.
 *
 * Usage:
 * ```typescript
 * createRouter()
 *     .use(requireAuth)
 *     .use(requireSuperAdmin)
 *     .openapi(SomeRoutes.endpoint, SomeHandler.endpoint);
 * ```
 */
export const requireSuperAdmin = async (ctx: AppContext, next: Next) => {
    if (!ctx.get('isSuperAdmin')) {
        const userId = ctx.get('userId');
        ctx.var.logger.warn({ userId }, "Forbidden: super admin access required");
        throw new ForbiddenError("Super admin access required");
    }
    await next();
};
