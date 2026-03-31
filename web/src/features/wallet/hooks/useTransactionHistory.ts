import { API_V1 } from "@shared";
import { useQuery } from "@tanstack/react-query";

export type Transaction = {
    id: string;
    amountCents: number;
    status: "pending" | "completed" | "reversed";
    description: string | null;
    transactionDate: string;
    sourceAccount: { name: string };
    destinationAccount: { name: string };
    category: { name: string };
    currency: { symbol: string; code: string };
};

export type TransactionHistoryResponse = {
    data: Transaction[];
    page: number;
    pageSize: number;
};

export const useTransactionHistory = (orgId?: string, page = 1, pageSize = 20) => {
    return useQuery<TransactionHistoryResponse>({
        queryKey: ["transactionHistory", orgId, page, pageSize],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(
                `${API_V1}/orgs/${orgId}/wallet/transactions?page=${page}&pageSize=${pageSize}`
            );
            if (!res.ok) throw new Error("Failed to fetch transaction history");
            return res.json();
        },
        enabled: !!orgId,
    });
};
