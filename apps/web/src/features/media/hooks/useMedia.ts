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
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
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

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].media.$get({
                param: { organizationId: orgId },
                query: {
                    type,
                    search,
                    cursor: options?.cursor,
                    direction: options?.direction,
                    limit: options?.limit ?? 15,
                },
            });
            return hcJson<MediaPaginatedResponse>(res);
        },
        enabled: !!orgId && isPagedMode,
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
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

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].media.$get({
                param: { organizationId: orgId },
                query: {
                    type,
                    search,
                    cursor: pageParam ?? undefined,
                    direction: pageParam ? "next" : undefined,
                    limit: 15,
                },
            });
            return hcJson<MediaPaginatedResponse>(res);
        },
        enabled: !!orgId && !isPagedMode,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.data.nextCursor,
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].media.$post({
                param: { organizationId: orgId },
                json: input,
            });
            return hcJson(res);
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].media[":mediaId"].$patch({
                param: { organizationId: orgId, mediaId },
                json: updates,
            });
            return hcJson<Media>(res);
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].media[":mediaId"].$delete({
                param: { organizationId: orgId, mediaId },
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

        isCreating: createMediaMutation.isPending,
        isUpdating: updateMediaMutation.isPending,
        isDeleting: deleteMediaMutation.isPending,
        fetchNextPage: infiniteQuery.fetchNextPage,
    };
};
