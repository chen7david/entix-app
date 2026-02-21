import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";
import type { Role } from "better-auth/plugins/access";
import { ForbiddenError, InternalServerError } from "@api/errors/app.error";
import { roles, type statement } from "@shared/auth/permissions";


/**
 * Middleware factory to enforce permission-based authorization
 * 
 * Uses the static access-control rules defined in shared/auth/permissions.ts.
 * Since permissions are derived from the role at definition time (not from DB),
 * the runtime cost is negligible — a simple object lookup.
 * 
 * Must be used AFTER requireOrgMembership middleware.
 * Requires membershipRole to be set in context.
 * 
 * @param resource - The resource to check (e.g. 'member', 'invitation', 'project')
 * @param actions  - The action(s) required (e.g. 'create', 'delete')
 * @returns Middleware function
 * 
 * Usage:
 * app.post('/api/v1/orgs/:organizationId/members',
 *   requireAuth,
 *   requireOrgMembership,
 *   requirePermission('member', ['create']),
 *   handler
 * );
 */
export const requirePermission = (
    resource: keyof typeof statement,
    actions: (typeof statement)[keyof typeof statement][number][]
) => {
    return async (ctx: AppContext, next: Next) => {
        // Super admins bypass all permission checks
        if (ctx.get('isSuperAdmin')) {
            ctx.var.logger.info(
                { userId: ctx.get('userId'), resource, actions },
                "Super admin bypass — skipping permission check"
            );
            await next();
            return;
        }

        const currentRoleString = ctx.get('membershipRole') as string | undefined;

        if (!currentRoleString) {
            throw new InternalServerError(
                "membershipRole not found in context. Ensure requireOrgMembership middleware runs first."
            );
        }

        const userRoles = currentRoleString.split(',').map((r) => r.trim());
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
            const userId = ctx.get('userId');
            const organizationId = ctx.get('organizationId');

            ctx.var.logger.warn(
                { userId, organizationId, roles: userRoles, resource, actions },
                "Forbidden: insufficient permissions across all assigned roles"
            );

            throw new ForbiddenError(
                lastError || `You do not have permission to perform [${actions.join(', ')}] on [${resource}]`
            );
        }

        await next();
    };
};
