import type { AdminCreditRequest, AdminDebitRequest } from "@shared/schemas/dto/financial.dto";
import type { Requester } from "./base-requester";

/**
 * Admin Finance API test client.
 */
export function createAdminFinanceClient(request: Requester) {
    return {
        finance: {
            /** GET /api/v1/admin/finance/treasury/balance */
            getTreasuryBalance: () =>
                request(`/api/v1/admin/finance/treasury/balance`, { method: "GET" }),

            /** GET /api/v1/admin/finance/orgs/:orgId/accounts */
            getOrgAccounts: (orgId: string) =>
                request(`/api/v1/admin/finance/orgs/${orgId}/accounts`, { method: "GET" }),

            /** POST /api/v1/admin/finance/orgs/:orgId/credit */
            adminCredit: (orgId: string, payload: AdminCreditRequest) =>
                request(`/api/v1/admin/finance/orgs/${orgId}/credit`, {
                    method: "POST",
                    body: payload,
                }),

            /** POST /api/v1/admin/finance/orgs/:orgId/debit */
            adminDebit: (orgId: string, payload: AdminDebitRequest) =>
                request(`/api/v1/admin/finance/orgs/${orgId}/debit`, {
                    method: "POST",
                    body: payload,
                }),

            /** PATCH /api/v1/admin/finance/accounts/:id */
            updateAccount: (id: string, name: string) =>
                request(`/api/v1/admin/finance/accounts/${id}`, {
                    method: "PATCH",
                    body: { name },
                }),

            /** PATCH /api/v1/admin/finance/accounts/:id/archive */
            archiveAccount: (id: string) =>
                request(`/api/v1/admin/finance/accounts/${id}/archive`, { method: "PATCH" }),
        },
    };
}

export type AdminFinanceClient = ReturnType<typeof createAdminFinanceClient>;
