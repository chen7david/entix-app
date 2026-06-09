import type { PassageType } from "@shared/constants/passage";
import type { PassageDto, PassageWithContentDto } from "@shared/schemas/dto/passage.dto";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { parseApiError } from "@web/src/utils/api";
import { App } from "antd";

export type { PassageType } from "@shared/constants/passage";
export type { PassageDto, PassageWithContentDto } from "@shared/schemas/dto/passage.dto";

type PassageListResponse = {
    data: PassageDto[];
    nextCursor: string | null;
    prevCursor: string | null;
};

async function hcJsonData<T>(res: Response): Promise<T> {
    const body = await hcJson<{ data: T }>(res);
    return body.data;
}

export type PassageFilters = {
    collectionId?: string;
    type?: PassageType;
    cefrLevel?: string;
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
};

export function usePassageLibrary(filters?: PassageFilters) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    const query = useQuery({
        queryKey: ["passages", organizationId, filters],
        enabled: !!organizationId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].passages.$get({
                param: { organizationId },
                query: {
                    collectionId: filters?.collectionId,
                    type: filters?.type,
                    cefrLevel: filters?.cefrLevel,
                    cursor: filters?.cursor,
                    limit: filters?.limit ?? 20,
                    direction: filters?.direction ?? "next",
                },
            });
            return hcJson<PassageListResponse>(res);
        },
    });

    return {
        passages: query.data?.data ?? [],
        nextCursor: query.data?.nextCursor ?? null,
        prevCursor: query.data?.prevCursor ?? null,
        isLoading: query.isLoading,
    };
}

export function usePassageById(passageId: string | undefined) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    return useQuery({
        queryKey: ["passage", organizationId, passageId],
        enabled: !!organizationId && !!passageId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            if (!organizationId || !passageId) throw new Error("Organization and passage required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].passages[":passageId"].$get({
                param: { organizationId, passageId },
            });
            return hcJsonData<PassageWithContentDto>(res);
        },
    });
}

export function useCreatePassage() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (payload: {
            title?: string;
            type?: PassageType;
            collectionId?: string;
            cefrLevel?: string;
            content?: string;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].passages.$post({
                param: { organizationId },
                json: payload,
            });
            return hcJsonData<PassageDto>(res);
        },
        onSuccess: () => {
            notification.success({ message: "Passage created" });
            queryClient.invalidateQueries({ queryKey: ["passages", organizationId] });
        },
        onError: (error: Error) =>
            notification.error({ message: "Failed to create passage", description: error.message }),
    });
}

export function useUpdatePassage() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (payload: {
            passageId: string;
            title?: string;
            type?: PassageType;
            collectionId?: string | null;
            cefrLevel?: string | null;
            content?: string;
        }) => {
            if (!organizationId) throw new Error("Organization required");
            const { passageId, collectionId, ...rest } = payload;
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].passages[":passageId"].$patch({
                param: { organizationId, passageId },
                json: {
                    ...rest,
                    ...(collectionId !== undefined ? { collectionId } : {}),
                },
            });
            return hcJsonData<PassageDto>(res);
        },
        onSuccess: (_data, vars) => {
            notification.success({ message: "Passage updated" });
            queryClient.invalidateQueries({ queryKey: ["passages", organizationId] });
            queryClient.invalidateQueries({
                queryKey: ["passage", organizationId, vars.passageId],
            });
        },
        onError: (error: Error) =>
            notification.error({ message: "Failed to update passage", description: error.message }),
    });
}

export function useDeletePassage() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (passageId: string) => {
            if (!organizationId) throw new Error("Organization required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].passages[":passageId"].$delete({
                param: { organizationId, passageId },
            });
            if (!res.ok) await parseApiError(res);
        },
        onSuccess: () => {
            notification.success({ message: "Passage deleted" });
            queryClient.invalidateQueries({ queryKey: ["passages", organizationId] });
        },
        onError: (error: Error) =>
            notification.error({ message: "Failed to delete passage", description: error.message }),
    });
}
