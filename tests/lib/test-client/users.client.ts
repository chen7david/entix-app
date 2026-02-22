import type { Requester } from "./base-requester";

/**
 * Users API test client.
 * All methods are org-scoped (require organizationId).
 */
export function createUsersClient(request: Requester) {
    return {
        /** GET /api/v1/orgs/:orgId/users */
        list: (orgId: string) =>
            request(`/api/v1/orgs/${orgId}/users`),
    };
}

export type UsersClient = ReturnType<typeof createUsersClient>;
