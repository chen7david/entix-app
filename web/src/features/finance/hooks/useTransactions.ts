import { API_V1 } from "@shared";
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
    description?: string;
    transactionDate: string;
    createdAt: string;
    sourceAccount: { name: string };
    destinationAccount: { name: string };
    category: { name: string };
    currency: { code: string; symbol: string };
};

export type TransactionsResponse = {
    data: TransactionRecord[];
    page: number;
    pageSize: number;
};

export type TransactionFilters = {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    txId?: string;
    accountId?: string;
    status?: string;
};

export const useTransactions = (orgId?: string, filters: TransactionFilters = {}) => {
    return useQuery({
        queryKey: ["transactions", orgId, filters],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");

            const params = new URLSearchParams();
            if (filters.page) params.append("page", filters.page.toString());
            if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
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
        select: (res) => ({
            items: res.data,
            page: res.page,
            pageSize: res.pageSize,
        }),
        enabled: !!orgId,
    });
};
