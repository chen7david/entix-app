import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
import { parseApiError } from "@web/src/utils/api";
import { useCallback, useRef } from "react";

/**
 * When playback actually starts (`MediaPlayer` `onPlay`), POSTs once per current `mediaId` until
 * `mediaId` changes. Covers pause/resume without double-counting, and new tracks / reopened drawers.
 */
export function useRecordMediaPlay(mediaId: string | undefined | null) {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    const mutation = useMutation({
        mutationFn: async (id: string) => {
            if (!orgId) throw new Error("Organization missing");
            const res = await fetch(`/api/v1/orgs/${orgId}/media/${id}/play`, {
                method: "POST",
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media"] });
        },
    });

    /** Dedupe repeated `onPlay` (e.g. pause → play) for the same asset. */
    const countedForIdRef = useRef<string | null>(null);
    /** When this differs from current `mediaId`, we clear the play dedupe (track change, drawer closed, etc.). */
    const sessionMediaIdRef = useRef<string | null | undefined>(undefined);

    const onPlaybackStarted = useCallback(() => {
        if (sessionMediaIdRef.current !== mediaId) {
            sessionMediaIdRef.current = mediaId;
            countedForIdRef.current = null;
        }
        if (!mediaId || !orgId) return;
        if (countedForIdRef.current === mediaId) return;
        countedForIdRef.current = mediaId;
        mutation.mutate(mediaId);
    }, [mediaId, orgId, mutation]);

    return onPlaybackStarted;
}
