/**
 * Lesson content endpoints use `fetch()` with string paths instead of `getApiClient()` because
 * these routes are not yet part of the Hono RPC client type graph; follow up by extending
 * `AppType` / client inference when OpenAPI client types include lesson content paths.
 */

import type { PassageType } from "@shared/constants/passage";
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

export type LessonPassageRowDto = {
    lessonId: string;
    passageId: string;
    position: number;
    addedAt: number;
    title: string | null;
    type: PassageType;
    cefrLevel: string | null;
    wordCount: number | null;
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

function lessonPassagesPath(organizationId: string, lessonId: string, passageId?: string) {
    const base = `/api/v1/orgs/${organizationId}/lessons/${lessonId}/passages`;
    return passageId ? `${base}/${passageId}` : base;
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

export function useLessonPassages(
    organizationId: string | undefined,
    lessonId: string | undefined
) {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: ["lesson-passages", organizationId, lessonId],
        enabled: !!organizationId && !!lessonId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId || !lessonId) throw new Error("Organization and lesson required");
            const res = await fetch(lessonPassagesPath(organizationId, lessonId), {
                credentials: "include",
            });
            return hcJson<LessonPassageRowDto[]>(res);
        },
    });
}

export function useAddLessonPassage() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            passageId: string;
        }) => {
            const res = await fetch(
                lessonPassagesPath(variables.organizationId, variables.lessonId),
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ passageId: variables.passageId }),
                }
            );
            return hcJson<LessonPassageRowDto>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-passages", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to link passage",
                description: error.message,
            });
        },
    });
}

export function useRemoveLessonPassage() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            passageId: string;
        }) => {
            const res = await fetch(
                lessonPassagesPath(
                    variables.organizationId,
                    variables.lessonId,
                    variables.passageId
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
                queryKey: ["lesson-passages", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to remove passage",
                description: error.message,
            });
        },
    });
}

export function useReorderLessonPassages() {
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (variables: {
            organizationId: string;
            lessonId: string;
            orderedIds: string[];
        }) => {
            const res = await fetch(
                `${lessonPassagesPath(variables.organizationId, variables.lessonId)}/reorder`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderedIds: variables.orderedIds }),
                }
            );
            return hcJson<LessonPassageRowDto[]>(res);
        },
        onSuccess: async (_, vars) => {
            await queryClient.invalidateQueries({
                queryKey: ["lesson-passages", vars.organizationId, vars.lessonId],
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Failed to reorder passages",
                description: error.message,
            });
        },
    });
}

/** GET single vocabulary bank row (for lesson printout / lookups). */
export async function fetchVocabularyBankItem(
    organizationId: string,
    vocabularyId: string
): Promise<VocabularyItemDTO> {
    const api = getApiClient();
    const res = await api.api.v1.orgs[":organizationId"].vocabulary.bank[":vocabId"].$get({
        param: { organizationId, vocabId: vocabularyId },
    });
    const body = await hcJson<{ data: VocabularyItemDTO }>(res);
    return body.data;
}
