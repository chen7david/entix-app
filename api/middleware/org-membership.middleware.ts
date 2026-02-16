import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";
import { ForbiddenError, UnauthorizedError } from "@api/errors/app.error";
import { getDbClient } from "@api/factories/db.factory";
import * as schema from "@api/db/schema.db";
import { eq, and } from "drizzle-orm";

/**
 * Middleware to verify user is a member of the organization
 * 
 * Must be used AFTER requireAuth middleware
 * Expects organizationId in route params
 * 
 * Sets the following context variables:
 * - organizationId: string
 * - membershipId: string  
 * - membershipRole: string
 * 
 * Usage:
 * ```typescript
 * app.use('/api/v1/organizations/:organizationId/*', requireOrgMembership);
 * ```
 */
export const requireOrgMembership = async (c: AppContext, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.req.param('organizationId');

    if (!userId) {
        throw new UnauthorizedError("Authentication required");
    }

    if (!organizationId) {
        throw new Error("organizationId parameter missing from route");
    }

    const db = getDbClient(c);
    const membership = await db.query.member.findFirst({
        where: and(
            eq(schema.member.userId, userId),
            eq(schema.member.organizationId, organizationId)
        )
    });

    if (!membership) {
        throw new ForbiddenError(
            `You are not a member of organization: ${organizationId}`
        );
    }

    // Store membership details in context
    c.set('organizationId', organizationId);
    c.set('membershipId', membership.id);
    c.set('membershipRole', membership.role);

    await next();
};
