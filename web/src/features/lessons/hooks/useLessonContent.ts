/**
 * Lesson content endpoints use `fetch()` with string paths instead of `getApiClient()` because
 * these routes are not yet part of the Hono RPC client type graph; follow up by extending
 * `AppType` / client inference when OpenAPI client types include lesson content paths.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import type { VocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";

export type { CefrLevel } from "@shared/constants/cefr";

export type ObjectiveDto = {
    id: string;
    lessonId: string;
    objective: string;
    position: number;
    createdAt: number;
    updatedAt: number;
};

export type LessonPlaylistRowDto = {
    lessonId: string;
    playlistId: string;
    position: number;
    addedAt: number;
};

export type LessonVocabRowDto = {
    lessonId: string;
    vocabularyId: string;
    position: number;
    addedAt: number;
};

function objectivesPath(organizationId: string, lessonId: string) {
    return `/api/v1/orgs/${organizationId}/lessons/${lessonId}/objectives`;
}

function playlistsPath(organizationId: string, lessonId: string, playlistId?: string) {
    const base = `/api/v1/orgs/${organizationId}/lessons/${lessonId}/playlists`;
    return playlistId ? `${base}/${playlistId}` : base;
}

function lessonVocabularyPath(organizationId: string, lessonId: string, vocabularyId?: string) {
    const base = `/api/v1/orgs/${organizationId}/lessons/${lessonId}/vocabulary`;
    return vocabularyId ? `${base}/${vocabularyId}` : base;
}

export function useLessonObjectives(
    organizationId: string | undefined,
    lessonId: string | undefined
) {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ["lesson-objectives", organizationId, lessonId],
        enabled: !!organizationId && !!lessonId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId || !lessonId) throw new Error("Organization and lesson required");
            const res = await fetch(objectivesPath(organizationId, lessonId), {
                credentials: "include",
            });
            return hcJson<ObjectiveDto[]>(res);
        },
    });
}

export function useReplaceObjectives() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            objectives: string[];
        }) => {
            const res = await fetch(objectivesPath(variables.organizationId, variables.lessonId), {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectives: variables.objectives }),
            });
            return hcJson<ObjectiveDto[]>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-objectives", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to replace objectives",
                description: error.message,
            });
        },
    });
}

export function useLessonPlaylists(
    organizationId: string | undefined,
    lessonId: string | undefined
) {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ["lesson-playlists", organizationId, lessonId],
        enabled: !!organizationId && !!lessonId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId || !lessonId) throw new Error("Organization and lesson required");
            const res = await fetch(playlistsPath(organizationId, lessonId), {
                credentials: "include",
            });
            return hcJson<LessonPlaylistRowDto[]>(res);
        },
    });
}

export function useAddLessonPlaylist() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            playlistId: string;
        }) => {
            const res = await fetch(playlistsPath(variables.organizationId, variables.lessonId), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playlistId: variables.playlistId,
                }),
            });
            return hcJson<LessonPlaylistRowDto>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-playlists", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to link playlist",
                description: error.message,
            });
        },
    });
}

export function useRemoveLessonPlaylist() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            playlistId: string;
        }) => {
            const res = await fetch(
                playlistsPath(variables.organizationId, variables.lessonId, variables.playlistId),
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-playlists", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to remove playlist",
                description: error.message,
            });
        },
    });
}

export function useLessonVocabulary(
    organizationId: string | undefined,
    lessonId: string | undefined
) {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ["lesson-vocabulary", organizationId, lessonId],
        enabled: !!organizationId && !!lessonId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId || !lessonId) throw new Error("Organization and lesson required");
            const res = await fetch(lessonVocabularyPath(organizationId, lessonId), {
                credentials: "include",
            });
            return hcJson<LessonVocabRowDto[]>(res);
        },
    });
}

export function useAddLessonVocabulary() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            vocabularyId: string;
        }) => {
            const res = await fetch(
                lessonVocabularyPath(variables.organizationId, variables.lessonId),
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        vocabularyId: variables.vocabularyId,
                    }),
                }
            );
            return hcJson<LessonVocabRowDto>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-vocabulary", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to add vocabulary",
                description: error.message,
            });
        },
    });
}

export function useRemoveLessonVocabulary() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            vocabularyId: string;
        }) => {
            const res = await fetch(
                lessonVocabularyPath(
                    variables.organizationId,
                    variables.lessonId,
                    variables.vocabularyId
                ),
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-vocabulary", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to remove vocabulary",
                description: error.message,
            });
        },
    });
}

export function useReorderLessonObjectives() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            orderedIds: string[];
        }) => {
            const res = await fetch(
                `${objectivesPath(variables.organizationId, variables.lessonId)}/reorder`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderedIds: variables.orderedIds }),
                }
            );
            return hcJson<ObjectiveDto[]>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-objectives", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to reorder objectives",
                description: error.message,
            });
        },
    });
}

export function useReorderLessonPlaylists() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            orderedIds: string[];
        }) => {
            const res = await fetch(
                `${playlistsPath(variables.organizationId, variables.lessonId)}/reorder`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderedIds: variables.orderedIds }),
                }
            );
            return hcJson<LessonPlaylistRowDto[]>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-playlists", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to reorder playlists",
                description: error.message,
            });
        },
    });
}

export function useReorderLessonVocabulary() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            orderedIds: string[];
        }) => {
            const res = await fetch(
                `${lessonVocabularyPath(variables.organizationId, variables.lessonId)}/reorder`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderedIds: variables.orderedIds }),
                }
            );
            return hcJson<LessonVocabRowDto[]>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-vocabulary", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to reorder vocabulary",
                description: error.message,
            });
        },
    });
}

/**
 * POST org vocabulary (find-or-create in bank) without session assignment.
 * Same server path as session "Add" but omits `sessionId`; use before linking a word to a lesson.
 */
export function useCreateBankVocabularyWord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: { organizationId: string; text: string }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].vocabulary.$post({
                param: { organizationId: variables.organizationId },
                json: { text: variables.text },
            });
            const body = await hcJson<{
                data: { vocabulary: VocabularyItemDTO; targetCount: number };
            }>(res);
            return body.data;
        },
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: ["vocabulary-bank-library", variables.organizationId],
            });
            void queryClient.invalidateQueries({
                queryKey: ["vocabulary-bank", variables.organizationId],
            });
            void queryClient.invalidateQueries({
                predicate: (q) =>
                    Array.isArray(q.queryKey) &&
                    q.queryKey[0] === "vocabulary-bank-item" &&
                    q.queryKey[1] === variables.organizationId,
            });
        },
    });
}

/** GET single vocabulary bank row (for lesson printout / lookups). */
export async function fetchVocabularyBankItem(organizationId: string, vocabularyId: string) {
    const res = await fetch(`/api/v1/orgs/${organizationId}/vocabulary/bank/${vocabularyId}`, {
        credentials: "include",
    });
    type BankWrap = {
        data: {
            text: string;
            zhTranslation: string | null;
            enAudioUrl: string | null;
            zhAudioUrl: string | null;
        };
    };
    const body = await hcJson<BankWrap>(res);
    return body.data;
}
