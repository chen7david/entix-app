import type { AppContext } from "@api/helpers/types.helpers";
import type { Next } from "hono";
import { ForbiddenError, InternalServerError, UnauthorizedError } from "@api/errors/app.error";
import { MemberRepository } from "@api/repositories/member.repository";

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
 * app.use('/api/v1/orgs/:organizationId/*', requireOrgMembership);
 */
export const requireOrgMembership = async (ctx: AppContext, next: Next) => {
    const userId = ctx.get('userId');
    const organizationId = ctx.req.param('organizationId');

    if (!userId) {
        throw new UnauthorizedError("Authentication required");
    }

    if (!organizationId) {
        throw new InternalServerError("organizationId parameter missing from route");
    }

    // Super admins bypass org membership check
    if (ctx.get('isSuperAdmin')) {
        ctx.var.logger.info({ userId, organizationId }, "Super admin bypass — skipping membership check");
        ctx.set('organizationId', organizationId);
        ctx.set('membershipId', 'super-admin'); // Sentinel value for super admins
        ctx.set('membershipRole', 'owner'); // Treat as owner for downstream handlers
        await next();
        return;
    }

    // Use repository pattern for consistency
    const memberRepo = new MemberRepository(ctx);
    const membership = await memberRepo.findMembership(userId, organizationId);

    if (!membership) {
        throw new ForbiddenError(
            `You are not a member of organization: ${organizationId}`
        );
    }

    // Store membership details in context
    ctx.set('organizationId', organizationId);
    ctx.set('membershipId', membership.id);
    ctx.set('membershipRole', membership.role);

    await next();
};
