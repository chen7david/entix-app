import type { Requester } from "./base-requester";

/**
 * Schedule API test client.
 */
export function createScheduleClient(request: Requester) {
    return {
        /** GET /api/v1/orgs/:orgId/schedule */
        list: (orgId: string, query?: { startDate?: number; endDate?: number }) => {
            const searchParams = new URLSearchParams();
            if (query?.startDate) searchParams.set("startDate", query.startDate.toString());
            if (query?.endDate) searchParams.set("endDate", query.endDate.toString());

            const queryString = searchParams.toString();
            const url = queryString
                ? `/api/v1/orgs/${orgId}/schedule?${queryString}`
                : `/api/v1/orgs/${orgId}/schedule`;

            return request(url, { method: "GET" });
        },

        /** POST /api/v1/orgs/:orgId/schedule */
        create: (orgId: string, payload: any) =>
            request(`/api/v1/orgs/${orgId}/schedule`, {
                method: "POST",
                body: payload,
            }),

        /** PATCH /api/v1/orgs/:orgId/schedule/:sessionId */
        update: (orgId: string, sessionId: string, payload: any) =>
            request(`/api/v1/orgs/${orgId}/schedule/${sessionId}`, {
                method: "PATCH",
                body: payload,
            }),

        /** PATCH /api/v1/orgs/:orgId/schedule/:sessionId/status */
        updateStatus: (orgId: string, sessionId: string, payload: { status: string }) =>
            request(`/api/v1/orgs/${orgId}/schedule/${sessionId}/status`, {
                method: "PATCH",
                body: payload,
            }),
    };
}

export type ScheduleClient = ReturnType<typeof createScheduleClient>;
