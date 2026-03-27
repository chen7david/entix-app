import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@web/src/lib/auth-client";

export const useAdminUsers = () => {
    return useQuery({
        queryKey: ["admin", "users"],
        queryFn: async () => {
            const res = await authClient.admin.listUsers({
                query: { limit: 100 },
            });
            if (res.error) throw res.error;
            return res.data.users;
        },
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
