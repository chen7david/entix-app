import { FINANCIAL_CURRENCIES } from "@shared/constants/financial";
import type {
    BillingPlanConflict,
    BulkImportOptionsDTO,
    BulkMemberItemDTO,
} from "@shared/schemas/dto/bulk-member.dto";
import type { CreateMemberDTO } from "@shared/schemas/dto/member.dto";
import type { Requester } from "./base-requester";

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
        export: (orgId: string) => request(`/api/v1/orgs/${orgId}/bulk/export`, { method: "GET" }),

        /** POST /api/v1/orgs/:orgId/bulk/import */
        import: async (
            orgId: string,
            members: BulkMemberItemDTO[],
            options?: Partial<BulkImportOptionsDTO> & {
                billingPlanConflict?: BillingPlanConflict;
            }
        ) => {
            let defaultBillingPlanId = options?.defaultBillingPlanId;

            if (!defaultBillingPlanId) {
                const plansRes = await request(
                    `/api/v1/orgs/${orgId}/finance/billing-plans?limit=1`,
                    { method: "GET" }
                );
                if (!plansRes.ok) return plansRes;
                const plansBody = (await plansRes.json()) as {
                    data: Array<{ id: string }>;
                };

                if (plansBody.data.length === 0) {
                    const createPlanRes = await request(
                        `/api/v1/orgs/${orgId}/finance/billing-plans`,
                        {
                            method: "POST",
                            body: {
                                name: "Default Import Plan",
                                currencyId: FINANCIAL_CURRENCIES.ETD,
                                overdraftLimitCents: 0,
                                rates: [{ participantCount: 1, rateCentsPerMinute: 100 }],
                            },
                        }
                    );
                    if (!createPlanRes.ok) return createPlanRes;
                    const createdPlanBody = (await createPlanRes.json()) as {
                        data: { id: string };
                    };
                    defaultBillingPlanId = createdPlanBody.data.id;
                } else {
                    defaultBillingPlanId = plansBody.data[0].id;
                }
            }

            return request(`/api/v1/orgs/${orgId}/bulk/import`, {
                method: "POST",
                body: {
                    members,
                    importOptions: {
                        defaultBillingPlanId,
                        billingPlanConflict: options?.billingPlanConflict ?? "replace",
                    },
                },
            });
        },
    };
}

export type MembersClient = ReturnType<typeof createMembersClient>;
