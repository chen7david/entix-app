import type { Requester } from "./base-requester";

export function createAdminClient(request: Requester) {
    return {
        organizations: {
            list: async () => {
                return request("/api/v1/admin/organizations", {
                    method: "GET",
                });
            },
        },
    };
}

export type AdminClient = ReturnType<typeof createAdminClient>;
