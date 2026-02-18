import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";
import { ForbiddenError, InternalServerError } from "@api/errors/app.error";

/**
 * Middleware factory to enforce role-based authorization
 * 
 * Must be used AFTER requireOrgMembership middleware
 * Requires membershipRole to be set in context
 * 
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function
 * 
 * Usage:
 * app.post('/api/v1/organizations/:organizationId/members', 
 *   requireAuth,
 *   requireOrgMembership,
 *   requireRole(['owner', 'admin']),
 *   handler
 * );
 */
export const requireRole = (allowedRoles: string[]) => {
    return async (c: AppContext, next: Next) => {
        const currentRole = c.get('membershipRole');

        if (!currentRole) {
            throw new InternalServerError("membershipRole not found in context. Ensure requireOrgMembership middleware runs first.");
        }

        if (!allowedRoles.includes(currentRole)) {
            const userId = c.get('userId');
            const organizationId = c.get('organizationId');

            c.var.logger.warn(
                { userId, organizationId, currentRole, allowedRoles },
                "Forbidden: User role not authorized"
            );

            throw new ForbiddenError(
                `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            );
        }

        await next();
    };
};

/**
 * Convenience middleware for owner-only routes
 */
export const requireOwner = requireRole(['owner']);

/**
 * Convenience middleware for owner or admin routes
 */
export const requireOwnerOrAdmin = requireRole(['owner', 'admin']);
