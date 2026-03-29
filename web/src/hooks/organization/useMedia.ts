import type { Media } from "@shared/db/schema";
import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { App } from "antd";
import { useCallback } from "react";

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

type PaginatedResponse<T> = {
    items: T[];
    nextCursor: string | null;
    prevCursor: string | null;
};

export const useMedia = (type?: "video" | "audio", search?: string) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // List Media
    const {
        data: mediaPages,
        isLoading: isLoadingMedia,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["media", orgId, type, search],
        queryFn: async ({ pageParam }) => {
            if (!orgId) return { items: [], nextCursor: null, prevCursor: null };

            const params = new URLSearchParams();
            if (type) params.append("type", type);
            if (search) params.append("search", search);
            if (pageParam) {
                params.append("cursor", pageParam);
                params.append("direction", "next");
            }
            params.append("limit", "15");

            const res = await fetch(`/api/v1/orgs/${orgId}/media?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch media");
            return (await res.json()) as PaginatedResponse<Media>;
        },
        enabled: !!orgId,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        placeholderData: keepPreviousData,
    });

    const media = mediaPages?.pages.flatMap((page) => page.items) ?? [];

    // Create Media
    const createMediaMutation = useMutation({
        mutationFn: async (input: CreateMediaInput) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
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
        },
    });

    // Update Media
    const updateMediaMutation = useMutation({
        mutationFn: async ({
            mediaId,
            updates,
        }: {
            mediaId: string;
            updates: UpdateMediaInput;
        }) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
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
        },
    });

    // Delete Media
    const deleteMediaMutation = useMutation({
        mutationFn: async (mediaId: string) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
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
        },
    });

    // Record Play
    const recordPlayMutation = useMutation({
        mutationFn: async (mediaId: string) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
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
        },
    });

    return {
        media,
        isLoadingMedia,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        createMedia: useCallback(
            (input: CreateMediaInput) => createMediaMutation.mutateAsync(input),
            [createMediaMutation]
        ),
        updateMedia: useCallback(
            (mediaId: string, updates: UpdateMediaInput) =>
                updateMediaMutation.mutateAsync({ mediaId, updates }),
            [updateMediaMutation]
        ),
        deleteMedia: useCallback(
            (mediaId: string) => deleteMediaMutation.mutateAsync(mediaId),
            [deleteMediaMutation]
        ),
        recordPlay: useCallback(
            (mediaId: string) => recordPlayMutation.mutateAsync(mediaId),
            [recordPlayMutation]
        ),

        isCreating: createMediaMutation.isPending,
        isUpdating: updateMediaMutation.isPending,
        isDeleting: deleteMediaMutation.isPending,
    };
};
