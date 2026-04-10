import type {
    AssignBillingPlanInput,
    BillingPlanPaginationInput,
    CreateBillingPlanInput,
} from "@shared/schemas/dto/billing-plan.dto";
import type {
    ActivateCurrencyRequest,
    ExecuteTransferRequest,
    ReverseTransactionRequest,
} from "@shared/schemas/dto/financial.dto";
import type { Requester } from "./base-requester";

/**
 * Finance API test client (Organization Scoped).
 */
export function createFinanceClient(request: Requester) {
    return {
        /** GET /api/v1/orgs/:orgId/finance/summary */
        getBalance: (orgId: string) =>
            request(`/api/v1/orgs/${orgId}/finance/summary`, { method: "GET" }),

        /** GET /api/v1/orgs/:orgId/finance/transactions */
        getTransactions: (orgId: string, query: Record<string, string | number | boolean> = {}) => {
            const params = new URLSearchParams(
                Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]
            );
            return request(`/api/v1/orgs/${orgId}/finance/transactions?${params.toString()}`, {
                method: "GET",
            });
        },

        /** POST /api/v1/orgs/:orgId/finance/reverse */
        reverseTransaction: (orgId: string, payload: ReverseTransactionRequest) =>
            request(`/api/v1/orgs/${orgId}/finance/reverse`, { method: "POST", body: payload }),

        /** POST /api/v1/orgs/:orgId/finance/transfer */
        executeTransfer: (orgId: string, payload: ExecuteTransferRequest) =>
            request(`/api/v1/orgs/${orgId}/finance/transfer`, { method: "POST", body: payload }),

        /** POST /api/v1/orgs/:orgId/finance/accounts */
        createAccount: (orgId: string, payload: unknown) =>
            request(`/api/v1/orgs/${orgId}/finance/accounts`, { method: "POST", body: payload }),

        /** GET /api/v1/orgs/:orgId/finance/currencies */
        getOrgCurrencyStatus: (orgId: string) =>
            request(`/api/v1/orgs/${orgId}/finance/currencies`, { method: "GET" }),

        /** POST /api/v1/orgs/:orgId/finance/currencies/activate */
        activateCurrency: (orgId: string, payload: ActivateCurrencyRequest) =>
            request(`/api/v1/orgs/${orgId}/finance/currencies/activate`, {
                method: "POST",
                body: payload,
            }),

        /** POST /api/v1/orgs/:orgId/finance/wallet/initialize */
        initializeUserWallet: (orgId: string, userId: string) =>
            request(`/api/v1/orgs/${orgId}/finance/wallet/initialize`, {
                method: "POST",
                body: { userId },
            }),

        /** POST /api/v1/orgs/:orgId/billing-plans */
        createBillingPlan: (orgId: string, payload: CreateBillingPlanInput) =>
            request(`/api/v1/orgs/${orgId}/billing-plans`, {
                method: "POST",
                body: payload,
            }),

        /** GET /api/v1/orgs/:orgId/billing-plans */
        getBillingPlans: (orgId: string, query: Partial<BillingPlanPaginationInput> = {}) => {
            const params = new URLSearchParams(
                Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]
            );
            return request(`/api/v1/orgs/${orgId}/billing-plans?${params.toString()}`, {
                method: "GET",
            });
        },

        /** POST /api/v1/orgs/:orgId/members/:userId/billing-plans */
        assignBillingPlan: (
            orgId: string,
            userId: string,
            payload: Pick<AssignBillingPlanInput, "planId">
        ) =>
            request(`/api/v1/orgs/${orgId}/members/${userId}/billing-plans`, {
                method: "POST",
                body: { ...payload, userId },
            }),

        /** DELETE /api/v1/orgs/:orgId/members/:userId/billing-plans/:assignmentId */
        unassignBillingPlan: (orgId: string, userId: string, assignmentId: string) =>
            request(`/api/v1/orgs/${orgId}/members/${userId}/billing-plans/${assignmentId}`, {
                method: "DELETE",
            }),
    };
}

export type FinanceClient = ReturnType<typeof createFinanceClient>;
