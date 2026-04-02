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
        getTransactions: (orgId: string, query: Record<string, any> = {}) => {
            const searchParams = new URLSearchParams(query as any).toString();
            return request(`/api/v1/orgs/${orgId}/finance/transactions?${searchParams}`, {
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
        createAccount: (orgId: string, payload: any) =>
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
    };
}

export type FinanceClient = ReturnType<typeof createFinanceClient>;
