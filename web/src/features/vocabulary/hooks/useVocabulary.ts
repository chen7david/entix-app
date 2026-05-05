import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";
import { useMemo } from "react";

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
    ipaUs: string | null;
    syllablesEn: string | null;
    syllablesIpa: string | null;
    definitionSimple: string | null;
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

type VocabularyBankListDTO = {
    data: VocabularyItemDTO[];
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
        onMutate: async (newVocab) => {
            if (!organizationId) return;

            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: ["vocabulary-bank-library", organizationId],
            });

            // Snapshot previous value
            const previousData = queryClient.getQueriesData({
                queryKey: ["vocabulary-bank-library", organizationId],
            });

            // Optimistically update the "first page" (queries without search/cursor)
            queryClient.setQueriesData(
                { queryKey: ["vocabulary-bank-library", organizationId] },
                (old: any) => {
                    // Only update if it's the first page (no cursor) and no active search
                    if (!old?.data || old.prevCursor) return old;

                    const tempItem: VocabularyItemDTO = {
                        id: `temp-${Date.now()}`,
                        text: newVocab.text,
                        status: "new",
                        zhTranslation: null,
                        pinyin: null,
                        ipaUs: null,
                        syllablesEn: null,
                        syllablesIpa: null,
                        definitionSimple: null,
                        enAudioUrl: null,
                        zhAudioUrl: null,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };

                    return {
                        ...old,
                        data: [tempItem, ...old.data],
                    };
                }
            );

            return { previousData };
        },
        onSuccess: (data) => {
            notification.success({
                message: "Vocabulary added",
                description:
                    data.targetCount > 0
                        ? `Attempted assignment to ${data.targetCount} student(s)`
                        : "Saved to vocabulary bank",
            });

            // Invalidate to get clean state, but also update cache for immediate feedback
            queryClient.invalidateQueries({
                queryKey: ["vocabulary-bank-library", organizationId],
            });
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown, _, context) => {
            // Rollback on error
            if (context?.previousData) {
                for (const [queryKey, data] of context.previousData) {
                    queryClient.setQueryData(queryKey, data);
                }
            }
            notification.error({
                message: "Failed to add vocabulary",
                description: getErrorMessage(error, "Unable to add vocabulary"),
            });
        },
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

    const removeSessionVocabularyMutation = useMutation({
        mutationFn: async (studentVocabId: string) => {
            if (!organizationId || !sessionId) throw new Error("Organization and session required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].sessions[":sessionId"].vocabulary[
                ":studentVocabId"
            ].$delete({
                param: { organizationId, sessionId, studentVocabId },
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Failed to remove vocabulary");
            }
        },
        onSuccess: () => {
            notification.success({ message: "Vocabulary removed" });
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown) =>
            notification.error({
                message: "Removal failed",
                description: getErrorMessage(error, "Unable to remove vocabulary"),
            }),
    });

    const removeVocabularyFromSessionMutation = useMutation({
        mutationFn: async (vocabId: string) => {
            if (!organizationId || !sessionId) throw new Error("Organization and session required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].sessions[
                ":sessionId"
            ].vocabulary.bank[":vocabId"].$delete({
                param: { organizationId, sessionId, vocabId },
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Failed to remove vocabulary from session");
            }
        },
        onSuccess: () => {
            notification.success({ message: "Vocabulary removed for all students" });
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown) =>
            notification.error({
                message: "Removal failed",
                description: getErrorMessage(error, "Unable to remove vocabulary"),
            }),
    });

    return {
        items: sessionVocabularyQuery.data?.data ?? [],
        nextCursor: sessionVocabularyQuery.data?.nextCursor ?? null,
        prevCursor: sessionVocabularyQuery.data?.prevCursor ?? null,
        isLoading: sessionVocabularyQuery.isLoading,
        error: sessionVocabularyQuery.error,
        createVocabularyMutation,
        assignVocabularyMutation,
        removeSessionVocabularyMutation,
        removeVocabularyFromSessionMutation,
    };
};

export const useVocabularyBank = (organizationId?: string, search?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    const vocabularyBankQuery = useInfiniteQuery({
        queryKey: ["vocabulary-bank", organizationId, search],
        queryFn: async ({ pageParam }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].vocabulary.bank.$get({
                param: { organizationId },
                query: {
                    limit: "20",
                    cursor: pageParam as string | undefined,
                    search,
                },
            });
            if (!res.ok) throw new Error("Failed to fetch vocabulary bank");
            return res.json() as Promise<VocabularyBankListDTO>;
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!organizationId,
    });

    const updateVocabularyBankMutation = useMutation({
        mutationFn: async ({
            vocabId,
            data,
        }: {
            vocabId: string;
            data: Partial<VocabularyItemDTO>;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].vocabulary.bank[":vocabId"].$patch(
                {
                    param: { organizationId, vocabId },
                    json: data,
                }
            );
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Failed to update vocabulary item");
            }
            const body = await hcJson<{ data: VocabularyItemDTO }>(res);
            return body.data;
        },
        onMutate: async (variables) => {
            const { vocabId, data } = variables;
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: ["vocabulary-bank-library", organizationId],
            });
            await queryClient.cancelQueries({ queryKey: ["vocabulary", organizationId] });

            // Snapshot previous values
            const previousBankData = queryClient.getQueryData([
                "vocabulary-bank-library",
                organizationId,
            ]);
            const previousSessionData = queryClient.getQueryData(["vocabulary", organizationId]);

            // Optimistically update all matching queries in the bank library
            queryClient.setQueriesData(
                { queryKey: ["vocabulary-bank-library", organizationId] },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((item: VocabularyItemDTO) =>
                            item.id === vocabId ? { ...item, ...data } : item
                        ),
                    };
                }
            );

            return { previousBankData, previousSessionData };
        },
        onSuccess: (updatedItem) => {
            notification.success({ message: "Vocabulary item updated" });
            // Final sync with real data
            queryClient.setQueriesData(
                { queryKey: ["vocabulary-bank-library", organizationId] },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((item: VocabularyItemDTO) =>
                            item.id === updatedItem.id ? updatedItem : item
                        ),
                    };
                }
            );
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown, __, context) => {
            // Rollback on error
            if (context?.previousBankData) {
                queryClient.setQueriesData(
                    { queryKey: ["vocabulary-bank-library", organizationId] },
                    context.previousBankData
                );
            }
            notification.error({
                message: "Update failed",
                description: getErrorMessage(error, "Unable to update vocabulary"),
            });
        },
    });

    const deleteVocabularyBankMutation = useMutation({
        mutationFn: async (vocabId: string) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].vocabulary.bank[
                ":vocabId"
            ].$delete({
                param: { organizationId, vocabId },
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || "Failed to delete vocabulary item");
            }
        },
        onSuccess: () => {
            notification.success({ message: "Vocabulary item deleted from bank" });
            queryClient.invalidateQueries({ queryKey: ["vocabulary-bank", organizationId] });
            queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] });
        },
        onError: (error: unknown) =>
            notification.error({
                message: "Deletion failed",
                description: getErrorMessage(error, "Unable to delete vocabulary item"),
            }),
    });

    const items = useMemo(
        () => vocabularyBankQuery.data?.pages.flatMap((page) => page.data) ?? [],
        [vocabularyBankQuery.data]
    );

    return {
        items,
        isLoading: vocabularyBankQuery.isLoading,
        isFetchingNextPage: vocabularyBankQuery.isFetchingNextPage,
        hasNextPage: vocabularyBankQuery.hasNextPage,
        fetchNextPage: vocabularyBankQuery.fetchNextPage,
        error: vocabularyBankQuery.error,
        updateVocabularyBankMutation,
        deleteVocabularyBankMutation,
    };
};

export const useVocabularyBankLibrary = (params: {
    organizationId?: string;
    search?: string;
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
}) => {
    const { isAuthenticated } = useAuth();
    const { organizationId, search, cursor, limit, direction } = params;

    const query = useQuery({
        queryKey: ["vocabulary-bank-library", organizationId, search, cursor, limit, direction],
        enabled: !!organizationId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].vocabulary.bank.$get({
                param: { organizationId },
                query: {
                    limit: (limit || 10).toString(),
                    cursor,
                    direction,
                    search,
                },
            });
            if (!res.ok) throw new Error("Failed to fetch vocabulary bank");
            return hcJson<VocabularyBankListDTO>(res);
        },
    });

    return {
        items: query.data?.data ?? [],
        nextCursor: query.data?.nextCursor ?? null,
        prevCursor: query.data?.prevCursor ?? null,
        isLoading: query.isLoading,
        error: query.error,
    };
};
