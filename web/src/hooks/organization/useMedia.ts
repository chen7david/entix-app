import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { message } from "antd";
import type { Media } from "@shared/db/schema.db";

type CreateMediaInput = {
    title: string;
    description?: string;
    uploadId: string;
    coverArtUploadId?: string;
};

type UpdateMediaInput = {
    title?: string;
    description?: string;
    coverArtUploadId?: string;
};

export const useMedia = (type?: "video" | "audio") => {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // List Media
    const { data: media = [], isLoading: isLoadingMedia } = useQuery({
        queryKey: ["media", orgId, type],
        queryFn: async () => {
            if (!orgId) return [];
            const url = type ? `/api/v1/orgs/${orgId}/media?type=${type}` : `/api/v1/orgs/${orgId}/media`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch media");
            return await res.json() as Media[];
        },
        enabled: !!orgId,
    });

    // Create Media
    const createMediaMutation = useMutation({
        mutationFn: async (input: CreateMediaInput) => {
            if (!orgId) throw new Error("Organization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) throw new Error("Failed to create media file");
            return await res.json();
        },
        onSuccess: () => {
            message.success("Media successfully created");
            queryClient.invalidateQueries({ queryKey: ["media", orgId] });
            // Invalidate uploads so the pending uploads drop from the standalone upload table
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: () => {
            message.error("Could not create media. Ensure the upload completed.");
        }
    });

    // Update Media
    const updateMediaMutation = useMutation({
        mutationFn: async ({ mediaId, updates }: { mediaId: string; updates: UpdateMediaInput }) => {
            if (!orgId) throw new Error("Organization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media/${mediaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error("Failed to update media");
            return await res.json();
        },
        onSuccess: () => {
            message.success("Media successfully updated");
            queryClient.invalidateQueries({ queryKey: ["media", orgId] });
        },
        onError: () => {
            message.error("Failed to update media details.");
        }
    });

    // Delete Media
    const deleteMediaMutation = useMutation({
        mutationFn: async (mediaId: string) => {
            if (!orgId) throw new Error("Organization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media/${mediaId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete media");
        },
        onSuccess: () => {
            message.success("Media strictly deleted from database and bucket");
            queryClient.invalidateQueries({ queryKey: ["media", orgId] });
        },
        onError: () => {
            message.error("Failed to sweep media asset.");
        }
    });

    // Record Play
    const recordPlayMutation = useMutation({
        mutationFn: async (mediaId: string) => {
            if (!orgId) throw new Error("Organization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media/${mediaId}/play`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Telemetry increment failed");
        },
        // We purposely do NOT invalidate the query strictly for this,
        // because we don't need UI-blocking loaders triggering on an anonymous play count ticker.
        onSuccess: () => {
            // Silently refresh the list in the background
            queryClient.invalidateQueries({ queryKey: ["media", orgId] });
        }
    });

    return {
        media,
        isLoadingMedia,
        createMedia: useCallback((input: CreateMediaInput) => createMediaMutation.mutateAsync(input), [createMediaMutation]),
        updateMedia: useCallback((mediaId: string, updates: UpdateMediaInput) => updateMediaMutation.mutateAsync({ mediaId, updates }), [updateMediaMutation]),
        deleteMedia: useCallback((mediaId: string) => deleteMediaMutation.mutateAsync(mediaId), [deleteMediaMutation]),
        recordPlay: useCallback((mediaId: string) => recordPlayMutation.mutateAsync(mediaId), [recordPlayMutation]),
        
        isCreating: createMediaMutation.isPending,
        isUpdating: updateMediaMutation.isPending,
        isDeleting: deleteMediaMutation.isPending,
    };
};
