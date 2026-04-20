import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";
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
            if (ownerType === "user" && !orgId)
                throw new Error("Organization ID required for member transactions");

            const baseUrl =
                ownerType === "org"
                    ? `${API_V1}/orgs/${id}/finance/transactions`
                    : `${API_V1}/orgs/${orgId}/members/${id}/wallet/transactions`;

            const params = new URLSearchParams({
                limit: limit.toString(),
            });

            if (cursor) params.append("cursor", cursor);
            if (filters?.startDate) params.append("startDate", filters.startDate);
            if (filters?.endDate) params.append("endDate", filters.endDate);
            if (filters?.status) params.append("status", filters.status);
            if (filters?.txId) params.append("txId", filters.txId);
            if (filters?.accountId) params.append("accountId", filters.accountId);

            const res = await fetch(`${baseUrl}?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch transaction history");
            return res.json();
        },
        enabled: ownerType === "org" ? !!id : !!id && !!orgId,
        staleTime: QUERY_STALE_MS,
    });
};
