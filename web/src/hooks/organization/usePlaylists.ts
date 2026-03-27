import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { message } from "antd";
import { useCallback } from "react";

// DTOs matching our Zod schemas
type Playlist = {
    id: string;
    organizationId: string;
    title: string;
    description: string | null;
    coverArtUrl: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
};

type PlaylistMediaSequenceItem = {
    playlistId: string;
    mediaId: string;
    position: number;
    addedAt: string;
};

type CreatePlaylistInput = {
    title: string;
    description?: string;
    coverArtUploadId?: string;
};

type UpdatePlaylistInput = Partial<CreatePlaylistInput>;

export const usePlaylists = () => {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // List Playlists
    const { data: playlists = [], isLoading: isLoadingPlaylists } = useQuery({
        queryKey: ["playlists", orgId],
        queryFn: async () => {
            if (!orgId) return [];
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists`);
            if (!res.ok) throw new Error("Failed to fetch playlists");
            return (await res.json()) as Playlist[];
        },
        enabled: !!orgId,
    });

    // Create Playlist
    const createPlaylistMutation = useMutation({
        mutationFn: async (input: CreatePlaylistInput) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) throw new Error("Failed to create playlist");
            return (await res.json()) as Playlist;
        },
        onSuccess: () => {
            message.success("Playlist created");
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: () => {
            message.error("Failed to sequence playlist");
        },
    });

    // Update Playlist
    const updatePlaylistMutation = useMutation({
        mutationFn: async ({
            playlistId,
            updates,
        }: {
            playlistId: string;
            updates: UpdatePlaylistInput;
        }) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error("Failed to patch playlist");
            return (await res.json()) as Playlist;
        },
        onSuccess: () => {
            message.success("Playlist properties saved");
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", orgId] });
        },
        onError: () => {
            message.error("Failed to commit settings");
        },
    });

    // Delete Playlist
    const deletePlaylistMutation = useMutation({
        mutationFn: async (playlistId: string) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete playlist");
        },
        onSuccess: () => {
            message.success("Playlist shattered");
            queryClient.invalidateQueries({ queryKey: ["playlists", orgId] });
        },
    });

    // Generic helper for Sequence operations
    const getSequence = async (playlistId: string): Promise<PlaylistMediaSequenceItem[]> => {
        if (!orgId) return [];
        const res = await fetch(`/api/v1/orgs/${orgId}/playlists/${playlistId}/sequence`);
        if (!res.ok) throw new Error("Failed to fetch sequence mappings");
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
            if (!res.ok) throw new Error("Failed to sync structural order");
        },
        onSuccess: (_, variables) => {
            // We can silently rewrite the query cache here or let React rely on local state
            queryClient.invalidateQueries({ queryKey: ["playlistSequence", variables.playlistId] });
        },
        onError: () => {
            message.error("Failed to persist the media order");
        },
    });

    return {
        playlists,
        isLoadingPlaylists,
        createPlaylist: useCallback(
            (input: CreatePlaylistInput) => createPlaylistMutation.mutateAsync(input),
            [createPlaylistMutation]
        ),
        updatePlaylist: useCallback(
            (playlistId: string, updates: UpdatePlaylistInput) =>
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
