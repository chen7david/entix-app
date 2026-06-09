import type { TextCollectionType } from "@shared/constants/passage";
import type { TextCollectionDto } from "@shared/schemas/dto/passage.dto";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";

export type { TextCollectionType } from "@shared/constants/passage";
export type { TextCollectionDto } from "@shared/schemas/dto/passage.dto";

type TextCollectionListResponse = {
    data: TextCollectionDto[];
    nextCursor: string | null;
    prevCursor: string | null;
};

async function hcJsonData<T>(res: Response): Promise<T> {
    const body = await hcJson<{ data: T }>(res);
    return body.data;
}

// ── List ──────────────────────────────────────────────────────────────────────

export type TextCollectionFilters = {
    type?: TextCollectionType;
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
};

export function useTextCollectionLibrary(filters?: TextCollectionFilters) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    const query = useQuery({
        queryKey: ["text-collections", organizationId, filters],
        enabled: !!organizationId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"]["text-collections"].$get({
                param: { organizationId },
                query: {
                    type: filters?.type,
                    cursor: filters?.cursor,
                    limit: filters?.limit ?? 20,
                    direction: filters?.direction ?? "next",
                },
            });
            return hcJson<TextCollectionListResponse>(res);
        },
    });

    return {
        collections: query.data?.data ?? [],
        nextCursor: query.data?.nextCursor ?? null,
        prevCursor: query.data?.prevCursor ?? null,
        isLoading: query.isLoading,
    };
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useTextCollectionById(collectionId: string | undefined) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    return useQuery({
        queryKey: ["text-collection", organizationId, collectionId],
        enabled: !!organizationId && !!collectionId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId || !collectionId)
                throw new Error("Organization and collection required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"]["text-collections"][
                ":collectionId"
            ].$get({ param: { organizationId, collectionId } });
            return hcJsonData<TextCollectionDto>(res);
        },
    });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateTextCollection() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (payload: {
            title: string;
            author?: string | null;
            description?: string | null;
            type: TextCollectionType;
            cefrLevel?: string | null;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"]["text-collections"].$post({
                param: { organizationId },
                json: payload,
            });
            return hcJsonData<TextCollectionDto>(res);
        },
        onSuccess: () => {
            notification.success({ message: "Collection created" });
            queryClient.invalidateQueries({ queryKey: ["text-collections", organizationId] });
        },
        onError: (error: Error) =>
            notification.error({
                message: "Failed to create collection",
                description: error.message,
            }),
    });
}

// ── Update ────────────────────────────────────────────────────────────────────

export function useUpdateTextCollection() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (payload: {
            collectionId: string;
            title?: string;
            author?: string | null;
            description?: string | null;
            type?: TextCollectionType;
            cefrLevel?: string | null;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const { collectionId, ...json } = payload;
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"]["text-collections"][
                ":collectionId"
            ].$patch({
                param: { organizationId, collectionId },
                json,
            });
            return hcJsonData<TextCollectionDto>(res);
        },
        onSuccess: (_data, vars) => {
            notification.success({ message: "Collection updated" });
            queryClient.invalidateQueries({ queryKey: ["text-collections", organizationId] });
            queryClient.invalidateQueries({
                queryKey: ["text-collection", organizationId, vars.collectionId],
            });
        },
        onError: (error: Error) =>
            notification.error({
                message: "Failed to update collection",
                description: error.message,
            }),
    });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function useDeleteTextCollection() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (collectionId: string) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"]["text-collections"][
                ":collectionId"
            ].$delete({
                param: { organizationId, collectionId },
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            notification.success({ message: "Collection deleted" });
            queryClient.invalidateQueries({ queryKey: ["text-collections", organizationId] });
        },
        onError: (error: Error) =>
            notification.error({
                message: "Failed to delete collection",
                description: error.message,
            }),
    });
}
