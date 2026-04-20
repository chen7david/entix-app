import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";

export const useUserProfile = (userId?: string) => {
    const queryClient = useQueryClient();

    const { data: aggregate, isLoading } = useQuery({
        queryKey: ["userProfile", userId],
        queryFn: async () => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.$get({
                param: { userId },
            });
            return hcJson(res) as any;
        },
        enabled: !!userId,
        staleTime: QUERY_STALE_MS,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });

    const upsertProfile = useMutation({
        mutationFn: async (payload: any) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.$put({
                param: { userId },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const addPhone = useMutation({
        mutationFn: async (payload: any) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.phones.$post({
                param: { userId },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const updatePhone = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.phones[":id"].$put({
                param: { userId, id },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const deletePhone = useMutation({
        mutationFn: async (id: string) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.phones[":id"].$delete({
                param: { userId, id },
            });
            if (!res.ok) await parseApiError(res);
            return res.json().catch(() => undefined);
        },
        onSuccess: invalidate,
    });
    const addAddress = useMutation({
        mutationFn: async (payload: any) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.addresses.$post({
                param: { userId },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const updateAddress = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.addresses[":id"].$put({
                param: { userId, id },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const deleteAddress = useMutation({
        mutationFn: async (id: string) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.addresses[":id"].$delete({
                param: { userId, id },
            });
            if (!res.ok) await parseApiError(res);
            return res.json().catch(() => undefined);
        },
        onSuccess: invalidate,
    });
    const addSocial = useMutation({
        mutationFn: async (payload: any) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.socials.$post({
                param: { userId },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const updateSocial = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.socials[":id"].$put({
                param: { userId, id },
                json: payload,
            });
            return hcJson(res);
        },
        onSuccess: invalidate,
    });
    const deleteSocial = useMutation({
        mutationFn: async (id: string) => {
            if (!userId) throw new Error("User ID required");
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].profile.socials[":id"].$delete({
                param: { userId, id },
            });
            if (!res.ok) await parseApiError(res);
            return res.json().catch(() => undefined);
        },
        onSuccess: invalidate,
    });

    return {
        aggregate,
        isLoading,
        upsertProfile,
        addPhone,
        updatePhone,
        deletePhone,
        addAddress,
        updateAddress,
        deleteAddress,
        addSocial,
        updateSocial,
        deleteSocial,
    };
};
