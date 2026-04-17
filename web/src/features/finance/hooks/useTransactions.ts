import { API_V1, type PaginatedResponse, type TransactionFilters } from "@shared";
import { useQuery } from "@tanstack/react-query";
import { parseApiError } from "@web/src/utils/api";

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

            const params = new URLSearchParams();
            if (filters.cursor) params.append("cursor", filters.cursor);
            if (filters.limit) params.append("limit", filters.limit.toString());
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);
            if (filters.minAmount) params.append("minAmount", filters.minAmount.toString());
            if (filters.maxAmount) params.append("maxAmount", filters.maxAmount.toString());
            if (filters.txId) params.append("txId", filters.txId);
            if (filters.accountId) params.append("accountId", filters.accountId);
            if (filters.status) params.append("status", filters.status);

            const url = `${API_V1}/orgs/${orgId}/finance/transactions?${params.toString()}`;

            const res = await fetch(url);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as TransactionsResponse;
        },
        select: (res): PaginatedResponse<TransactionRecord> => ({
            items: res.data,
            nextCursor: res.nextCursor,
            prevCursor: null,
        }),
        enabled: !!orgId,
    });
};
