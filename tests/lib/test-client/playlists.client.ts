import type { Requester } from "./base-requester";

/**
 * Playlist API test client.
 * All methods are org-scoped (require organizationId).
 */
export function createPlaylistsClient(request: Requester) {
    return {
        /** GET /api/v1/orgs/:orgId/playlists */
        list: (
            orgId: string,
            query?: { limit?: number; cursor?: string; direction?: string; search?: string }
        ) => {
            const searchParams = new URLSearchParams();
            if (query?.limit) searchParams.set("limit", query.limit.toString());
            if (query?.cursor) searchParams.set("cursor", query.cursor);
            if (query?.direction) searchParams.set("direction", query.direction);
            if (query?.search) searchParams.set("search", query.search);

            const queryString = searchParams.toString();
            const url = queryString
                ? `/api/v1/orgs/${orgId}/playlists?${queryString}`
                : `/api/v1/orgs/${orgId}/playlists`;

            return request(url, { method: "GET" });
        },

        /** GET /api/v1/orgs/:orgId/playlists/:playlistId */
        get: (orgId: string, playlistId: string) => {
            return request(`/api/v1/orgs/${orgId}/playlists/${playlistId}`, { method: "GET" });
        },

        /** POST /api/v1/orgs/:orgId/playlists */
        create: (orgId: string, body: { title: string; description?: string }) => {
            return request(`/api/v1/orgs/${orgId}/playlists`, {
                method: "POST",
                body,
            });
        },

        /** GET /api/v1/orgs/:orgId/playlists/:playlistId/sequence */
        getSequence: (orgId: string, playlistId: string) => {
            return request(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`, {
                method: "GET",
            });
        },

        /** PUT /api/v1/orgs/:orgId/playlists/:playlistId/sequence */
        updateSequence: (orgId: string, playlistId: string, mediaIds: string[]) => {
            return request(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`, {
                method: "PUT",
                body: { mediaIds },
            });
        },
    };
}

export type PlaylistsClient = ReturnType<typeof createPlaylistsClient>;
