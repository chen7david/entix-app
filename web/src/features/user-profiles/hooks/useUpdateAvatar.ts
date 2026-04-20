import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";

/**
 * Hook for updating a member's avatar via the avatar API endpoint.
 * After the image has been uploaded and the upload completed, this hook
 * links the upload to the user's profile image.
 */
export const useUpdateAvatar = () => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { refreshAuth } = useAuth();

    return useMutation({
        mutationFn: async ({ userId, uploadId }: { userId: string; uploadId: string }) => {
            const api = getApiClient();
            const res = await api.api.v1.users[":userId"].avatar.$patch({
                param: { userId },
                json: { uploadId },
            });

            return hcJson<{ imageUrl: string }>(res);
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });

            await refreshAuth();

            notification.success({
                message: "Avatar Updated",
                description: "Your profile picture has been updated successfully.",
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Update Failed",
                description: error.message || "Failed to update profile picture",
            });
        },
    });
};

/**
 * Hook for removing a member's avatar.
 * Deletes the avatar from R2 and clears the user.image field.
 */
export const useRemoveAvatar = () => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { refreshAuth } = useAuth();

    return useMutation({
        mutationFn: async (userId: string) => {
            const api = getApiClient();
            const response = await api.api.v1.users[":userId"].avatar.$delete({
                param: { userId },
            });

            if (!response.ok && response.status !== 204) await parseApiError(response);

            return true;
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });

            await refreshAuth();

            notification.success({
                message: "Avatar Removed",
                description: "Your profile picture has been removed.",
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Remove Failed",
                description: error.message || "Failed to remove profile picture",
            });
        },
    });
};
