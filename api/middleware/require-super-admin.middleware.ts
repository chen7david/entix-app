import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@api/helpers/types.helpers";
import { ForbiddenError } from "@api/errors/app.error";

/**
 * Middleware that restricts a route to super admins (platform-level admins) only.
 *
 * Must be used AFTER requireAuth middleware, which sets `isSuperAdmin` in context.
 */
export const requireSuperAdmin = createMiddleware<AppEnv>(async (ctx, next) => {
    if (!ctx.get('isSuperAdmin')) {
        const userId = ctx.get('userId');
        ctx.var.logger.warn({ userId }, "Forbidden: super admin access required");
        throw new ForbiddenError("Super admin access required");
    }
    await next();
});
