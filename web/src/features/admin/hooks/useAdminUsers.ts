import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { authClient } from "@web/src/lib/auth-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";

export const useAdminUsers = (
    search?: string,
    options?: { cursor?: string; limit?: number; direction?: "next" | "prev" }
) => {
    return useQuery({
        queryKey: ["admin", "users", search, options?.cursor, options?.limit, options?.direction],
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.admin.users.$get({
                query: {
                    search,
                    cursor: options?.cursor,
                    limit: options?.limit,
                    direction: options?.direction,
                },
            });
            return hcJson<{
                items: any[];
                nextCursor: string | null;
                prevCursor: string | null;
            }>(res);
        },
        staleTime: QUERY_STALE_MS,
    });
};

export const useImpersonateUser = () => {
    return useMutation({
        mutationFn: async (userId: string) => {
            const res = await authClient.admin.impersonateUser({ userId });
            if (res.error) throw new Error(res.error.message);
            return res;
        },
        onSuccess: () => {
            window.location.href = "/"; // Redirect to root, auth flow will route to correct dashboard
        },
    });
};

export const useBanUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, banReason }: { userId: string; banReason?: string }) => {
            const res = await authClient.admin.banUser({ userId, banReason });
            if (res.error) throw new Error(res.error.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
    });
};

export const useUnbanUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            const res = await authClient.admin.unbanUser({ userId });
            if (res.error) throw new Error(res.error.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
    });
};

export const useSetUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: "user" | "admin" }) => {
            const res = await authClient.admin.setRole({ userId, role });
            if (res.error) throw new Error(res.error.message);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
    });
};

export const useResendVerification = () => {
    return useMutation({
        mutationFn: async (email: string) => {
            const res = await authClient.$fetch("/admin/resend-verification", {
                method: "POST",
                body: { email },
            });
            if (res.error) throw new Error(res.error.message);
            return res.data;
        },
    });
};
