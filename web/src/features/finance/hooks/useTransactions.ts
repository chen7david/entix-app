import type { PaginatedResponse, TransactionFilters } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export type TransactionRecord = {
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
    category: { name: string; isExpense: boolean; isRevenue: boolean };
    currency: { code: string; symbol: string };
};

export type TransactionsResponse = {
    data: TransactionRecord[];
    nextCursor: string | null;
};

export const useTransactions = (orgId?: string, filters: Partial<TransactionFilters> = {}) => {
    return useQuery({
        queryKey: ["transactions", orgId, filters],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.transactions.$get({
                param: { organizationId: orgId },
                query: {
                    cursor: filters.cursor,
                    limit: filters.limit,
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    minAmount: filters.minAmount,
                    maxAmount: filters.maxAmount,
                    txId: filters.txId,
                    accountId: filters.accountId,
                    status: filters.status,
                },
            });
            return hcJson<TransactionsResponse>(res);
        },
        select: (res): PaginatedResponse<TransactionRecord> => ({
            items: res.data,
            nextCursor: res.nextCursor,
            prevCursor: null,
        }),
        staleTime: QUERY_STALE_MS,
        enabled: !!orgId,
    });
};
