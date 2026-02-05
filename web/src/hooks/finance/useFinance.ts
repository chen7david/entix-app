import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/v1/finance";

// Schemas (Optional but good for type safety if imported from shared API types, but here I'll define interfaces)
export interface FinancialAccount {
    currency: string;
    balance: number; // Cents
    code: string | null;
}

export interface FinancialTransaction {
    id: string;
    type: string;
    description: string;
    amount?: number; // Calculated or from posting? 
    // The API returns transaction object which doesn't have amount directly, it has postings.
    // getTransactions returns transactionWithPostingsSchema.
    createdAt: string;
    postings: {
        amount: number;
        account: {
            currency: string;
            userId: string;
        }
    }[];
}

export function useBalance(currency?: string) {
    return useQuery({
        queryKey: ['balance', currency],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (currency) params.append('currency', currency);
            const res = await fetch(`${API_BASE}/balance?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch balance");
            return await res.json() as FinancialAccount[];
        }
    });
}

export function useTransactions(params?: { currency?: string, limit?: number, cursor?: string }) {
    return useQuery({
        queryKey: ['transactions', params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (params?.currency) query.append('currency', params.currency);
            if (params?.limit) query.append('limit', params.limit.toString());
            if (params?.cursor) query.append('cursor', params.cursor);

            const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch transactions");
            return await res.json() as FinancialTransaction[];
        }
    });
}

export function useTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            email: string; // Changed from recipientId
            amount: number; // Cents
            currency: string;
            pin: string;
            description?: string;
        }) => {
            const res = await fetch(`${API_BASE}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Transfer failed");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });
}

export function useSetPin() {
    return useMutation({
        mutationFn: async (data: { pin: string, password: string }) => {
            const res = await fetch(`${API_BASE}/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to set PIN");
            }
            return await res.json();
        }
    });
}

export function useReverseTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { transactionId: string, reason: string }) => {
            const res = await fetch(`${API_BASE}/reverse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Reversal failed");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['balance'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });
}
