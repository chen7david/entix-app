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

        /** GET /api/v1/users/:userId/profile */
        profile: {
            get: (userId: string) =>
                request(`/api/v1/users/${userId}/profile`),
        }
    };
}

export type UsersClient = ReturnType<typeof createUsersClient>;
