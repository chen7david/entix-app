import type { AppOpenApi } from "@api/helpers/types.helpers";
import { requireAuth } from "@api/middleware/auth.middleware";
import { requireOrgMembership } from "@api/middleware/org-membership.middleware";

/**
 * Mount authentication and authorization middleware
 * 
 * Two-layer approach:
 * - Layer 1: requireAuth - Validates session and sets userId
 * - Layer 2: requireOrgMembership - Validates org membership and sets org context
 * 
 * @param app - The Hono app instance to apply middleware to
 */
export const mountAuthMiddleware = (app: AppOpenApi) => {
    // Layer 1: Authentication (sets userId in context)
    app.use('/api/v1/organizations/*', requireAuth);

    // Layer 2: Organization membership (sets organizationId, membershipId, membershipRole)
    app.use('/api/v1/organizations/:organizationId/*', requireOrgMembership);
};
