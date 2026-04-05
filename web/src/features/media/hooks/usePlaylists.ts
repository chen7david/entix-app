import type {
    CreatePlaylistDTO,
    PlaylistDTO,
    PlaylistMediaItemDTO,
    UpdatePlaylistDTO,
} from "@shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";
import { useCallback } from "react";

export const usePlaylists = () => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // List Playlists
    const { data: playlists = [], isLoading: isLoadingPlaylists } = useQuery({
        queryKey: ["playlists", orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists`);
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as PlaylistDTO[];
        },
        enabled: !!orgId,
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
            message.success("Playlist created");
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to create playlist");
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
            message.success("Playlist properties saved");
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to update playlist");
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
            message.success("Playlist deleted");
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to delete playlist");
        },
    });

    // Generic helper for Sequence operations
    const getSequence = async (playlistId: string): Promise<PlaylistMediaItemDTO[]> => {
        if (!orgId) return [];
        const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`);
        if (!res.ok) await parseApiError(res);
        return await res.json();
    };

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
            queryClient.invalidateQueries({ queryKey: ["playlistSequence", variables.playlistId] });
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to persist the media order");
        },
    });

    return {
        playlists,
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
