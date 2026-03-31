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

export const useTransactionHistory = (
    id?: string,
    ownerType: "user" | "org" = "org",
    page = 1,
    pageSize = 20,
    orgId?: string
) => {
    return useQuery<TransactionHistoryResponse>({
        queryKey: ["transactionHistory", id, ownerType, page, pageSize, orgId],
        queryFn: async () => {
            if (!id) throw new Error("ID required");
            if (ownerType === "user" && !orgId)
                throw new Error("Organization ID required for member transactions");

            const url =
                ownerType === "org"
                    ? `${API_V1}/orgs/${id}/finance/transactions?page=${page}&pageSize=${pageSize}`
                    : `${API_V1}/orgs/${orgId}/members/${id}/wallet/transactions?page=${page}&pageSize=${pageSize}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch transaction history");
            return res.json();
        },
        enabled: ownerType === "org" ? !!id : !!id && !!orgId,
    });
};
