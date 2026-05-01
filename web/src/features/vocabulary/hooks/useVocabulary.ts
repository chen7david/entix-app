import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

export type VocabularyStatus =
    | "new"
    | "processing_text"
    | "text_ready"
    | "processing_audio"
    | "active"
    | "review";

export type VocabularyItemDTO = {
    id: string;
    text: string;
    zhTranslation: string | null;
    pinyin: string | null;
    enAudioUrl: string | null;
    zhAudioUrl: string | null;
    status: VocabularyStatus;
    createdAt: number;
    updatedAt: number;
};

export type SessionVocabularyItemDTO = {
    id: string;
    userId: string;
    organizationId: string;
    attendanceId: string;
    createdAt: number;
    vocabulary: VocabularyItemDTO;
};

type SessionVocabularyListDTO = {
    data: SessionVocabularyItemDTO[];
    nextCursor: string | null;
    prevCursor: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
}

export const useVocabulary = (organizationId?: string, sessionId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    const queryKey = ["vocabulary", organizationId, "session", sessionId];

    const sessionVocabularyQuery = useQuery({
        queryKey,
        queryFn: async () => {
            if (!organizationId || !sessionId) {
                return {
                    data: [],
                    nextCursor: null,
                    prevCursor: null,
                } satisfies SessionVocabularyListDTO;
            }
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].sessions[
                ":sessionId"
            ].vocabulary.$get({
                param: { organizationId, sessionId },
            });
            return hcJson<SessionVocabularyListDTO>(res);
        },
        enabled: !!organizationId && !!sessionId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
    });

    const createVocabularyMutation = useMutation({
        mutationFn: async (payload: { text: string; sessionId?: string }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].vocabulary.$post({
                param: { organizationId },
                json: payload,
            });
            const body = await hcJson<{
                data: { vocabulary: VocabularyItemDTO; targetCount: number };
            }>(res);
            return body.data;
        },
        onSuccess: (data) => {
            notification.success({
                message: "Vocabulary added",
                description:
                    data.targetCount > 0
                        ? `Attempted assignment to ${data.targetCount} student(s)`
                        : "Saved to vocabulary bank",
            });
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown) =>
            notification.error({
                message: "Failed to add vocabulary",
                description: getErrorMessage(error, "Unable to add vocabulary"),
            }),
    });

    const assignVocabularyMutation = useMutation({
        mutationFn: async (payload: { vocabId: string; userId: string; attendanceId: string }) => {
            if (!organizationId || !sessionId) throw new Error("Organization and session required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].sessions[":sessionId"].vocabulary[
                ":vocabId"
            ].assign.$post({
                param: { organizationId, sessionId, vocabId: payload.vocabId },
                json: { userId: payload.userId, attendanceId: payload.attendanceId },
            });
            const body = await hcJson<{
                data: {
                    id: string;
                    userId: string;
                    organizationId: string;
                    vocabularyId: string;
                    attendanceId: string;
                    createdAt: number;
                };
            }>(res);
            return body.data;
        },
        onSuccess: () => {
            notification.success({ message: "Vocabulary assigned" });
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown) => {
            const message = getErrorMessage(error, "Unable to assign vocabulary");
            notification.error({
                message: message.toLowerCase().includes("already")
                    ? "Already assigned"
                    : "Assignment failed",
                description: message,
            });
        },
    });

    return {
        items: sessionVocabularyQuery.data?.data ?? [],
        nextCursor: sessionVocabularyQuery.data?.nextCursor ?? null,
        prevCursor: sessionVocabularyQuery.data?.prevCursor ?? null,
        isLoading: sessionVocabularyQuery.isLoading,
        error: sessionVocabularyQuery.error,
        createVocabularyMutation,
        assignVocabularyMutation,
    };
};
