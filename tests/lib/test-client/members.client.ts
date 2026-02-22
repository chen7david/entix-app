import type { Requester } from "./base-requester";
import type { CreateMemberDTO } from "@shared/schemas/dto/member.dto";

/**
 * Members API test client.
 * All methods are org-scoped (require organizationId).
 */
export function createMembersClient(request: Requester) {
    return {
        /** POST /api/v1/orgs/:orgId/members */
        create: (orgId: string, payload: CreateMemberDTO) =>
            request(`/api/v1/orgs/${orgId}/members`, { method: "POST", body: payload }),
    };
}

export type MembersClient = ReturnType<typeof createMembersClient>;
