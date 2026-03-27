import type { Requester } from "./base-requester";
import type { CreateMemberDTO } from "@shared/schemas/dto/member.dto";
import type { 
    BulkMemberItemDTO, 
} from "@shared/schemas/dto/bulk-member.dto";

/**
 * Members API test client.
 * All methods are org-scoped (require organizationId).
 */
export function createMembersClient(request: Requester) {
    return {
        /** POST /api/v1/orgs/:orgId/members */
        create: (orgId: string, payload: CreateMemberDTO) =>
            request(`/api/v1/orgs/${orgId}/members`, { method: "POST", body: payload }),

        /** GET /api/v1/orgs/:orgId/bulk/metrics */
        getMetrics: (orgId: string) => 
            request(`/api/v1/orgs/${orgId}/bulk/metrics`, { method: "GET" }),

        /** GET /api/v1/orgs/:orgId/bulk/export */
        export: (orgId: string) => 
            request(`/api/v1/orgs/${orgId}/bulk/export`, { method: "GET" }),

        /** POST /api/v1/orgs/:orgId/bulk/import */
        import: (orgId: string, payload: BulkMemberItemDTO[]) => 
            request(`/api/v1/orgs/${orgId}/bulk/import`, { method: "POST", body: payload }),
    };
}

export type MembersClient = ReturnType<typeof createMembersClient>;
