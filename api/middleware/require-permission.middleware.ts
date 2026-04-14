import { ForbiddenError, InternalServerError, UnauthorizedError } from "@api/errors/app.error";
import { getMemberRepository } from "@api/factories/repository.factory";
import type { AppEnv } from "@api/helpers/types.helpers";
import { roles, type statement } from "@shared/auth/permissions";
import type { Role } from "better-auth/plugins/access";
import { createMiddleware } from "hono/factory";

/**
 * Middleware factory to enforce permission-based authorization
 *
 * Uses the static access-control rules defined in shared/auth/permissions.ts.
 * Since permissions are derived from the role at definition time (not from DB),
 * the runtime cost is negligible — a simple object lookup.
 *
 * Must be used AFTER requireAuth (sets userId).
 * Must be used AFTER requireOrgMembership (if checking membership roles).
 *
 * @param resource - The resource to check (e.g. 'student', 'invitation', 'project')
 * @param actions  - The action(s) required (e.g. 'create', 'delete')
 * @param allowSelfTargetParam - (Optional) If provided, bypasses RBAC if ctx.req.param(allowSelfTargetParam) === ctx.get('userId'). Useful for profile updates.
 * @returns Middleware function
 */
export const requirePermission = (
    resource: keyof typeof statement,
    actions: (typeof statement)[keyof typeof statement][number][],
    allowSelfTargetParam?: string
) => {
    return createMiddleware<AppEnv>(async (ctx, next) => {
        const userId = ctx.get("userId");

        if (!userId) {
            throw new UnauthorizedError("Authentication required to access this resource");
        }

        if (ctx.get("isSuperAdmin")) {
            ctx.var.logger.info(
                { userId, resource, actions },
                "Super admin bypass — skipping permission check"
            );
            await next();
            return;
        }

        if (allowSelfTargetParam) {
            const targetId = ctx.req.param(allowSelfTargetParam);
            if (targetId && targetId === userId) {
                await next();
                return;
            }
        }

        let currentRoleString = ctx.get("membershipRole") as string | undefined;

        if (!currentRoleString && allowSelfTargetParam) {
            const targetUserId = ctx.req.param(allowSelfTargetParam);
            if (targetUserId) {
                const memberRepo = getMemberRepository(ctx);
                const commonRoles = await memberRepo.findCommonOrgRoles(userId, targetUserId);
                if (commonRoles.length > 0) {
                    currentRoleString = commonRoles.join(",");
                }
            }
        }

        if (!currentRoleString && !allowSelfTargetParam) {
            ctx.var.logger.error(
                {
                    method: ctx.req.method,
                    url: ctx.req.url,
                    resource,
                    actions,
                },
                "membershipRole not found in context for protected route"
            );

            throw new InternalServerError(
                `membershipRole not found in context for ${ctx.req.method} ${ctx.req.url}. Ensure requireOrgMembership middleware runs first or use for global resources cautiously.`
            );
        }

        const userRoles = currentRoleString
            ? currentRoleString.split(",").map((r) => r.trim())
            : [];
        let hasPermission = false;
        let lastError = "";

        for (const roleName of userRoles) {
            const roleDefinition = roles[roleName as keyof typeof roles] as Role | undefined;

            if (!roleDefinition) {
                ctx.var.logger.warn(`Unknown role encountered: ${roleName}`);
                continue;
            }

            const result = roleDefinition.authorize({ [resource]: actions });
            if (result.success) {
                hasPermission = true;
                break;
            } else {
                lastError = result.error || "";
            }
        }

        if (!hasPermission) {
            const userId = ctx.get("userId");
            const organizationId = ctx.get("organizationId");

            ctx.var.logger.warn(
                { userId, organizationId, roles: userRoles, resource, actions },
                "Forbidden: insufficient permissions across all assigned roles"
            );

            throw new ForbiddenError(
                lastError ||
                    `You do not have permission to perform [${actions.join(", ")}] on [${resource}]`
            );
        }

        await next();
    });
};
