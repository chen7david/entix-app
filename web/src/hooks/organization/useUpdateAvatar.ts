import { useQueryClient, useMutation } from "@tanstack/react-query";
import { message } from "antd";

/**
 * Hook for updating a member's avatar via the avatar API endpoint.
 * After the image has been uploaded and the upload completed, this hook
 * links the upload to the user's profile image.
 */
export const useUpdateAvatar = (organizationId: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, uploadId }: { userId: string; uploadId: string }) => {
            if (!organizationId) throw new Error("Organization ID is required");

            const response = await fetch(`/api/v1/orgs/${organizationId}/members/${userId}/avatar`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Failed to update avatar");
            }

            return response.json() as Promise<{ imageUrl: string }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizationMembers", organizationId] });
            message.success("Profile picture updated successfully");
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to update profile picture");
        },
    });
};

/**
 * Hook for removing a member's avatar.
 * Deletes the avatar from R2 and clears the user.image field.
 */
export const useRemoveAvatar = (organizationId: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            if (!organizationId) throw new Error("Organization ID is required");

            const response = await fetch(`/api/v1/orgs/${organizationId}/members/${userId}/avatar`, {
                method: "DELETE",
            });

            if (!response.ok && response.status !== 204) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Failed to remove avatar");
            }

            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizationMembers", organizationId] });
            message.success("Profile picture removed");
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to remove profile picture");
        },
    });
};
