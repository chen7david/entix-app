import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

// Matches the full TransactionRecord shape expected by TransactionLedgerTable
export type Transaction = {
    id: string;
    organizationId: string;
    categoryId: string;
    sourceAccountId: string;
    destinationAccountId: string;
    currencyId: string;
    amountCents: number;
    status: "pending" | "completed" | "reversed";
    description: string | null;
    transactionDate: string;
    createdAt: string;
    sourceAccount: { name: string };
    destinationAccount: { name: string };
    category: { name: string };
    currency: { symbol: string; code: string };
};

export type TransactionHistoryResponse = {
    data: Transaction[];
    nextCursor: string | null;
};

export const useTransactionHistory = (
    id?: string,
    ownerType: "user" | "org" = "org",
    cursor?: string,
    limit = 20,
    orgId?: string,
    filters?: {
        startDate?: string;
        endDate?: string;
        status?: string;
        txId?: string;
        accountId?: string;
    }
) => {
    return useQuery<TransactionHistoryResponse>({
        queryKey: [
            "transactionHistory",
            id,
            ownerType,
            cursor,
            limit,
            orgId,
            filters?.accountId,
            filters?.status,
            filters?.startDate,
            filters?.endDate,
            filters?.txId,
        ],
        queryFn: async () => {
            if (!id) throw new Error("ID required");

            const api = getApiClient();
            const query = {
                limit,
                cursor,
                startDate: filters?.startDate,
                endDate: filters?.endDate,
                status: filters?.status,
                txId: filters?.txId,
                accountId: filters?.accountId,
            };

            if (ownerType === "org") {
                const res = await api.api.v1.orgs[":organizationId"].finance.transactions.$get({
                    param: { organizationId: id },
                    query,
                });
                return hcJson<TransactionHistoryResponse>(res);
            }

            if (!orgId) throw new Error("Organization ID required for member transactions");
            const res = await api.api.v1.orgs[":organizationId"].members[
                ":userId"
            ].wallet.transactions.$get({
                param: { organizationId: orgId, userId: id },
                query,
            });
            return hcJson<TransactionHistoryResponse>(res);
        },
        enabled: ownerType === "org" ? !!id : !!id && !!orgId,
        staleTime: QUERY_STALE_MS,
    });
};
