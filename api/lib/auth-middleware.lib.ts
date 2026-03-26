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
 * NOTE: Since these are mounted globally on /api/v1/orgs/*, routes within this prefix
 * should NOT manually include requireAuth or requireOrgMembership in their middleware array
 * to avoid redundant checks and database lookups. Granular RBAC (requirePermission)
 * should still be applied per-route.
 * 
 * @param app - The Hono app instance to apply middleware to
 */
export const mountAuthMiddleware = (app: AppOpenApi) => {
    app.use('/api/v1/orgs/*', requireAuth);
    app.use('/api/v1/users/*', requireAuth);

    app.use('/api/v1/orgs/:organizationId/*', requireOrgMembership);
};
