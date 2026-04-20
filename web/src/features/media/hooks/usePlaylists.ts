import type {
    CreatePlaylistDTO,
    EnrichedPlaylistMediaItemDTO,
    PaginatedResponse,
    PlaylistDTO,
    PlaylistMediaItemDTO,
    UpdatePlaylistDTO,
} from "@shared";
import { enrichedPlaylistMediaItemSchema } from "@shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";
import { useCallback } from "react";
import { z } from "zod";

export type PlaylistFilters = {
    search?: string;
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
};

export const usePlaylist = (playlistId?: string) => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    return useQuery({
        queryKey: ["playlist", orgId, playlistId],
        queryFn: async () => {
            if (!orgId || !playlistId) throw new Error("Missing org or playlist id");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists[":playlistId"].$get({
                param: { organizationId: orgId, playlistId },
            });
            return hcJson<PlaylistDTO>(res);
        },
        enabled: !!orgId && !!playlistId,
        staleTime: QUERY_STALE_MS,
    });
};

export const usePlaylistSequence = (playlistId?: string) => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    return useQuery({
        queryKey: ["playlistSequence", orgId, playlistId],
        queryFn: async (): Promise<EnrichedPlaylistMediaItemDTO[]> => {
            if (!orgId || !playlistId) throw new Error("Missing org or playlist id");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists[
                ":playlistId"
            ].sequence.$get({
                param: { organizationId: orgId, playlistId },
            });
            const raw = await hcJson<unknown>(res);
            const parsed = z.array(enrichedPlaylistMediaItemSchema).parse(raw);
            return [...parsed].sort((a, b) => a.position - b.position);
        },
        enabled: !!orgId && !!playlistId,
        staleTime: QUERY_STALE_MS,
    });
};

export const usePlaylists = (filters?: PlaylistFilters) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    const { data: playlistsResponse, isLoading: isLoadingPlaylists } = useQuery({
        queryKey: ["playlists", orgId, filters],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization missing");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists.$get({
                param: { organizationId: orgId },
                query: {
                    search: filters?.search,
                    cursor: filters?.cursor,
                    limit: filters?.limit,
                    direction: filters?.direction,
                },
            });
            return hcJson<PaginatedResponse<PlaylistDTO>>(res);
        },
        enabled: !!orgId,
        staleTime: QUERY_STALE_MS,
        placeholderData: (previousData) => previousData,
    });

    const createPlaylistMutation = useMutation({
        mutationFn: async (input: CreatePlaylistDTO) => {
            if (!orgId) throw new Error("Organization missing");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists.$post({
                param: { organizationId: orgId },
                json: input,
            });
            return hcJson<PlaylistDTO>(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Playlist Created",
                description: "Playlist has been created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Creation Failed",
                description: error.message || "Failed to create playlist.",
            });
        },
    });

    const updatePlaylistMutation = useMutation({
        mutationFn: async ({
            playlistId,
            updates,
        }: {
            playlistId: string;
            updates: UpdatePlaylistDTO;
        }) => {
            if (!orgId) throw new Error("Organization missing");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists[":playlistId"].$patch({
                param: { organizationId: orgId, playlistId },
                json: updates,
            });
            return hcJson<PlaylistDTO>(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Playlist Updated",
                description: "Playlist properties have been saved successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Update Failed",
                description: error.message || "Failed to update playlist.",
            });
        },
    });

    const deletePlaylistMutation = useMutation({
        mutationFn: async (playlistId: string) => {
            if (!orgId) throw new Error("Organization missing");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists[":playlistId"].$delete({
                param: { organizationId: orgId, playlistId },
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            notification.success({
                message: "Playlist Deleted",
                description: "Playlist has been deleted successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Deletion Failed",
                description: error.message || "Failed to delete playlist.",
            });
        },
    });

    /** @deprecated Use usePlaylistSequence instead */
    const getSequence = useCallback(
        async (playlistId: string): Promise<PlaylistMediaItemDTO[]> => {
            if (!orgId) return [];
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists[
                ":playlistId"
            ].sequence.$get({
                param: { organizationId: orgId, playlistId },
            });
            if (!res.ok) await parseApiError(res);
            return await res.json();
        },
        [orgId]
    );

    const updateSequenceMutation = useMutation({
        mutationFn: async ({
            playlistId,
            mediaIds,
        }: {
            playlistId: string;
            mediaIds: string[];
        }) => {
            if (!orgId) throw new Error("Organization missing");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].playlists[
                ":playlistId"
            ].sequence.$put({
                param: { organizationId: orgId, playlistId },
                json: { mediaIds },
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["playlistSequence", orgId, variables.playlistId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Order Persist Failed",
                description: error.message || "Failed to persist the media order.",
            });
        },
    });

    return {
        playlistsResponse,
        isLoadingPlaylists,
        createPlaylist: useCallback(
            (input: CreatePlaylistDTO) => createPlaylistMutation.mutateAsync(input),
            [createPlaylistMutation]
        ),
        updatePlaylist: useCallback(
            (playlistId: string, updates: UpdatePlaylistDTO) =>
                updatePlaylistMutation.mutateAsync({ playlistId, updates }),
            [updatePlaylistMutation]
        ),
        deletePlaylist: useCallback(
            (playlistId: string) => deletePlaylistMutation.mutateAsync(playlistId),
            [deletePlaylistMutation]
        ),
        getSequence,
        updateSequence: useCallback(
            (playlistId: string, mediaIds: string[]) =>
                updateSequenceMutation.mutateAsync({ playlistId, mediaIds }),
            [updateSequenceMutation]
        ),

        isCreating: createPlaylistMutation.isPending,
        isUpdating: updatePlaylistMutation.isPending,
        isDeleting: deletePlaylistMutation.isPending,
        isSequencing: updateSequenceMutation.isPending,
    };
};
