import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@web/src/features/organization";
import { getApiClient } from "@web/src/lib/api-client";
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
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].media[":mediaId"].play.$post({
                param: { organizationId: orgId, mediaId: id },
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media"] });
        },
    });

    const countedForIdRef = useRef<string | null>(null);
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
