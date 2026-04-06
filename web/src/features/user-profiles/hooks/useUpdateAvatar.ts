import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
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
            const response = await fetch(`${API_V1}/users/${userId}/avatar`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId }),
            });

            if (!response.ok) await parseApiError(response);

            return (await response.json()) as Promise<{ imageUrl: string }>;
        },
        onSuccess: async () => {
            // Invalidate the members list to update the table immediately
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });

            // Globally refresh the active session to sync Sidebar and Top Nav
            // This triggers refetch() on useSession and useActiveMember hooks
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
            const response = await fetch(`${API_V1}/users/${userId}/avatar`, {
                method: "DELETE",
            });

            if (!response.ok && response.status !== 204) await parseApiError(response);

            return true;
        },
        onSuccess: async () => {
            // Invalidate the members list
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });

            // Globally refresh session data for UI consistency
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
