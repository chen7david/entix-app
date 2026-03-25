import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_V1 } from "@web/src/lib/api";

export const useUserProfile = (userId?: string) => {
    const queryClient = useQueryClient();

    const { data: aggregate, isLoading } = useQuery({
        queryKey: ['userProfile', userId],
        queryFn: async () => {
            const res = await fetch(`${API_V1}/users/${userId}/profile`);
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        enabled: !!userId
    });

    const buildMutation = (method: 'POST' | 'PUT' | 'DELETE', pathSuffix: string) => {
        return async (payload?: any) => {
            const res = await fetch(`${API_V1}/users/${userId}/profile${pathSuffix}`, {
                method,
                headers: payload ? { 'Content-Type': 'application/json' } : undefined,
                body: payload ? JSON.stringify(payload) : undefined
            });
            if (!res.ok) throw new Error(`Request failed: ${pathSuffix}`);
            return res.json();
        };
    };

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });

    const upsertProfile = useMutation({ mutationFn: buildMutation('PUT', ''), onSuccess: invalidate });
    const addPhone = useMutation({ mutationFn: buildMutation('POST', '/phones'), onSuccess: invalidate });
    const updatePhone = useMutation({ mutationFn: ({ id, payload }: { id: string, payload: any }) => buildMutation('PUT', `/phones/${id}`)(payload), onSuccess: invalidate });
    const deletePhone = useMutation({ mutationFn: (id: string) => buildMutation('DELETE', `/phones/${id}`)(), onSuccess: invalidate });
    const addAddress = useMutation({ mutationFn: buildMutation('POST', '/addresses'), onSuccess: invalidate });
    const updateAddress = useMutation({ mutationFn: ({ id, payload }: { id: string, payload: any }) => buildMutation('PUT', `/addresses/${id}`)(payload), onSuccess: invalidate });
    const deleteAddress = useMutation({ mutationFn: (id: string) => buildMutation('DELETE', `/addresses/${id}`)(), onSuccess: invalidate });
    const addSocial = useMutation({ mutationFn: buildMutation('POST', '/socials'), onSuccess: invalidate });
    const updateSocial = useMutation({ mutationFn: ({ id, payload }: { id: string, payload: any }) => buildMutation('PUT', `/socials/${id}`)(payload), onSuccess: invalidate });
    const deleteSocial = useMutation({ mutationFn: (id: string) => buildMutation('DELETE', `/socials/${id}`)(), onSuccess: invalidate });

    return { 
        aggregate, isLoading, 
        upsertProfile, addPhone, updatePhone, deletePhone, addAddress, updateAddress, deleteAddress, addSocial, updateSocial, deleteSocial 
    };
};
