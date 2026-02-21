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

        const currentRole = ctx.get('membershipRole') as keyof typeof roles | undefined;

        if (!currentRole) {
            throw new InternalServerError(
                "membershipRole not found in context. Ensure requireOrgMembership middleware runs first."
            );
        }

        const roleDefinition = roles[currentRole] as Role | undefined;

        if (!roleDefinition) {
            throw new ForbiddenError(`Unknown role: ${currentRole}`);
        }

        const result = roleDefinition.authorize({ [resource]: actions });

        if (!result.success) {
            const userId = ctx.get('userId');
            const organizationId = ctx.get('organizationId');

            ctx.var.logger.warn(
                { userId, organizationId, currentRole, resource, actions },
                "Forbidden: insufficient permissions"
            );

            throw new ForbiddenError(
                result.error || `You do not have permission to perform [${actions.join(', ')}] on [${resource}]`
            );
        }

        await next();
    };
};
