import { authClient } from "@web/src/lib/auth-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Session {
    id: string;
    userId: string;
    token: string; // Required for revokeSession
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

export function useListSessions() {
    return useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const response = await authClient.listSessions();
            return response.data as Session[];
        },
    });
}

export function useRevokeSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (token: string) => {
            // Use Better Auth's native revokeSession client API
            const response = await authClient.revokeSession({ token });
            return response;
        },
        onSuccess: () => {
            // Invalidate and refetch sessions
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
    });
}

export function useRevokeOtherSessions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await authClient.revokeOtherSessions();
            return response;
        },
        onSuccess: () => {
            // Invalidate and refetch sessions
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
    });
}
