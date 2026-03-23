import type { Requester } from "./base-requester";

/**
 * Media API test client.
 * All methods are org-scoped (require organizationId).
 */
export function createMediaClient(request: Requester) {
    return {
        /** GET /api/v1/orgs/:orgId/media */
        list: (orgId: string, query?: { limit?: number; cursor?: string; direction?: string; search?: string }) => {
            const searchParams = new URLSearchParams();
            if (query?.limit) searchParams.set("limit", query.limit.toString());
            if (query?.cursor) searchParams.set("cursor", query.cursor);
            if (query?.direction) searchParams.set("direction", query.direction);
            if (query?.search) searchParams.set("search", query.search);
            
            const queryString = searchParams.toString();
            const url = queryString ? `/api/v1/orgs/${orgId}/media?${queryString}` : `/api/v1/orgs/${orgId}/media`;
            
            return request(url, { method: "GET" });
        }
    };
}

export type MediaClient = ReturnType<typeof createMediaClient>;
