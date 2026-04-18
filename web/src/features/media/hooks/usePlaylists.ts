import type {
    CreatePlaylistDTO,
    EnrichedPlaylistMediaItemDTO,
    PaginatedResponse,
    PlaylistDTO,
    PlaylistMediaItemDTO, // TODO: remove with getSequence
    UpdatePlaylistDTO,
} from "@shared";
import { enrichedPlaylistMediaItemSchema } from "@shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
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
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as PlaylistDTO;
        },
        enabled: !!orgId && !!playlistId,
    });
};

export const usePlaylistSequence = (playlistId?: string) => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    return useQuery({
        queryKey: ["playlistSequence", orgId, playlistId],
        // refetchOnWindowFocus intentionally disabled globally (App.tsx).
        // Player will reflect server state on mount; sequence changes in
        // other tabs require a page reload to appear.
        queryFn: async (): Promise<EnrichedPlaylistMediaItemDTO[]> => {
            if (!orgId || !playlistId) throw new Error("Missing org or playlist id");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`);
            if (!res.ok) await parseApiError(res);
            const raw = await res.json();
            const parsed = z.array(enrichedPlaylistMediaItemSchema).parse(raw);
            return [...parsed].sort((a, b) => a.position - b.position);
        },
        enabled: !!orgId && !!playlistId,
    });
};

export const usePlaylists = (filters?: PlaylistFilters) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // List Playlists (Paginated)
    const { data: playlistsResponse, isLoading: isLoadingPlaylists } = useQuery({
        queryKey: ["playlists", orgId, filters],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization missing");
            const params = new URLSearchParams();
            if (filters?.search) params.append("search", filters.search);
            if (filters?.cursor) params.append("cursor", filters.cursor);
            if (filters?.limit) params.append("limit", filters.limit.toString());
            if (filters?.direction) params.append("direction", filters.direction);

            const queryString = params.toString() ? `?${params.toString()}` : "";
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists${queryString}`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as PaginatedResponse<PlaylistDTO>;
        },
        enabled: !!orgId,
        placeholderData: (previousData) => previousData,
    });

    // Create Playlist
    const createPlaylistMutation = useMutation({
        mutationFn: async (input: CreatePlaylistDTO) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as PlaylistDTO;
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

    // Update Playlist
    const updatePlaylistMutation = useMutation({
        mutationFn: async ({
            playlistId,
            updates,
        }: {
            playlistId: string;
            updates: UpdatePlaylistDTO;
        }) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as PlaylistDTO;
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

    // Delete Playlist
    const deletePlaylistMutation = useMutation({
        mutationFn: async (playlistId: string) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}`, {
                method: "DELETE",
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

    // Generic helper for Sequence operations
    /** @deprecated Use usePlaylistSequence instead */
    const getSequence = useCallback(
        async (playlistId: string): Promise<PlaylistMediaItemDTO[]> => {
            if (!orgId) return [];
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`);
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
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mediaIds }),
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
