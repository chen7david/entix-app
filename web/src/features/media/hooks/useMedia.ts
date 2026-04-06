import type { Media } from "@shared";
import {
    type InfiniteData,
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";
import { useCallback, useMemo } from "react";

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

type MediaPaginatedResponse = {
    data: {
        items: Media[];
        nextCursor: string | null;
        prevCursor: string | null;
    };
};

export interface UseMediaOptions {
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
}

export const useMedia = (type?: "video" | "audio", search?: string, options?: UseMediaOptions) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    const isPagedMode = options?.cursor !== undefined || options?.limit !== undefined;

    // Paged Query (Discrete pages)
    const pagedQuery = useQuery({
        queryKey: [
            "media",
            "paged",
            orgId,
            type,
            search,
            options?.cursor,
            options?.limit,
            options?.direction,
        ],
        queryFn: async () => {
            if (!orgId) return { data: { items: [], nextCursor: null, prevCursor: null } };

            const params = new URLSearchParams();
            if (type) params.append("type", type);
            if (search) params.append("search", search);
            if (options?.cursor) params.append("cursor", options.cursor);
            if (options?.direction) params.append("direction", options.direction);
            params.append("limit", (options?.limit ?? 15).toString());

            const res = await fetch(`/api/v1/orgs/${orgId}/media?${params.toString()}`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as MediaPaginatedResponse;
        },
        enabled: !!orgId && isPagedMode,
        placeholderData: keepPreviousData,
    });

    // Infinite Query (Legacy / Load More)
    const infiniteQuery = useInfiniteQuery<
        MediaPaginatedResponse,
        Error,
        InfiniteData<MediaPaginatedResponse>,
        (string | undefined)[],
        string | null
    >({
        queryKey: ["media", "infinite", orgId, type, search],
        queryFn: async ({ pageParam }) => {
            if (!orgId) return { data: { items: [], nextCursor: null, prevCursor: null } };

            const params = new URLSearchParams();
            if (type) params.append("type", type);
            if (search) params.append("search", search);
            if (pageParam) {
                params.append("cursor", pageParam);
                params.append("direction", "next");
            }
            params.append("limit", "15");

            const res = await fetch(`/api/v1/orgs/${orgId}/media?${params.toString()}`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as MediaPaginatedResponse;
        },
        enabled: !!orgId && !isPagedMode,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.data.nextCursor,
        placeholderData: keepPreviousData,
    });

    // Unified Result Mapping
    const media = useMemo(() => {
        if (isPagedMode) return pagedQuery.data?.data.items ?? [];
        if (!infiniteQuery.data) return [];
        return infiniteQuery.data.pages.flatMap((page) => page.data.items);
    }, [isPagedMode, pagedQuery.data, infiniteQuery.data]);

    // Create Media
    const createMediaMutation = useMutation({
        mutationFn: async (input: CreateMediaInput) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) await parseApiError(res);
            return await res.json();
        },
        onSuccess: () => {
            notification.success({
                message: "Media Created",
                description: "Media has been successfully created.",
            });
            queryClient.invalidateQueries({ queryKey: ["media"] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Creation Failed",
                description:
                    error.message || "Could not create media. Ensure the upload completed.",
            });
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
            if (!res.ok) await parseApiError(res);
            return await res.json();
        },
        onSuccess: () => {
            notification.success({
                message: "Media Updated",
                description: "Media has been successfully updated.",
            });
            queryClient.invalidateQueries({ queryKey: ["media"] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Update Failed",
                description: error.message || "Failed to update media details.",
            });
        },
    });

    // Delete Media
    const deleteMediaMutation = useMutation({
        mutationFn: async (mediaId: string) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media/${mediaId}`, {
                method: "DELETE",
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Media Deleted",
                description: "Media asset has been strictly deleted.",
            });
            queryClient.invalidateQueries({ queryKey: ["media"] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Deletion Failed",
                description: error.message || "Failed to sweep media asset.",
            });
        },
    });

    // Record Play
    const recordPlayMutation = useMutation({
        mutationFn: async (mediaId: string) => {
            if (!orgId) throw new Error("AuthOrganization ID missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media/${mediaId}/play`, {
                method: "POST",
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media"] });
        },
    });

    return {
        media,
        isLoadingMedia: isPagedMode ? pagedQuery.isLoading : infiniteQuery.isLoading,
        nextCursor: isPagedMode ? (pagedQuery.data?.data.nextCursor ?? null) : null,
        prevCursor: isPagedMode ? (pagedQuery.data?.data.prevCursor ?? null) : null,
        hasNextPage: isPagedMode ? !!pagedQuery.data?.data.nextCursor : !!infiniteQuery.hasNextPage,
        hasPrevPage: isPagedMode ? !!pagedQuery.data?.data.prevCursor : false,
        isFetchingNextPage: isPagedMode ? pagedQuery.isFetching : infiniteQuery.isFetchingNextPage,
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
        fetchNextPage: infiniteQuery.fetchNextPage,
    };
};
