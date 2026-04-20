import type { MemberDTO, OrgRole, PaginatedResponse } from "@shared";
import {
    type InfiniteData,
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { getApiClient } from "@web/src/lib/api-client";
import { authClient } from "@web/src/lib/auth-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { useCallback, useMemo } from "react";
import { useOrganization } from "./useOrganization";

export interface UseMembersOptions {
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
}

export const useMembers = (searchQuery?: string, options?: UseMembersOptions) => {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const { isSuperAdmin } = useAuth();

    const isPagedMode = options?.cursor !== undefined || options?.limit !== undefined;

    // Paged Query (Discrete pages)
    const pagedQuery = useQuery({
        queryKey: [
            "organizationMembers",
            "paged",
            activeOrganization?.id,
            searchQuery,
            options?.cursor,
            options?.limit,
            options?.direction,
        ],
        queryFn: async () => {
            if (!activeOrganization?.id)
                return { items: [], total: 0, nextCursor: null, prevCursor: null };

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].users.$get({
                param: { organizationId: activeOrganization.id },
                query: {
                    limit: options?.limit ?? 10,
                    cursor: options?.cursor,
                    direction: options?.direction,
                    search: searchQuery,
                },
            });
            return hcJson<PaginatedResponse<MemberDTO>>(res);
        },
        enabled: !!activeOrganization?.id && isPagedMode,
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
    });

    // Infinite Query (Legacy / Load More)
    const infiniteQuery = useInfiniteQuery<
        PaginatedResponse<MemberDTO>,
        Error,
        InfiniteData<PaginatedResponse<MemberDTO>>,
        string[],
        string | undefined
    >({
        queryKey: ["organizationMembers", "infinite", activeOrganization?.id, searchQuery],
        queryFn: async ({ pageParam }) => {
            if (!activeOrganization?.id)
                return { items: [], total: 0, nextCursor: null, prevCursor: null };

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].users.$get({
                param: { organizationId: activeOrganization.id },
                query: {
                    limit: 10,
                    cursor: pageParam,
                    search: searchQuery,
                },
            });
            return hcJson<PaginatedResponse<MemberDTO>>(res);
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined,
        enabled: !!activeOrganization?.id && !isPagedMode,
        placeholderData: keepPreviousData,
        staleTime: QUERY_STALE_MS,
    });

    // Unified Result Mapping
    const members = useMemo(() => {
        if (isPagedMode) return pagedQuery.data?.items ?? [];
        if (!infiniteQuery.data) return [];
        return infiniteQuery.data.pages.flatMap((p) => p.items);
    }, [isPagedMode, pagedQuery.data, infiniteQuery.data]);

    const activeMember = authClient.useActiveMember();

    const userRoles = useMemo(() => {
        return (activeMember.data?.role || "")
            .split(",")
            .map((r: string) => r.trim())
            .filter(Boolean);
    }, [activeMember.data?.role]);

    const checkPermission = useCallback(
        (permission: { permissions: Record<string, string[]> }) => {
            if (isSuperAdmin) return true;
            if (!userRoles.length) return false;

            return userRoles.some((role: string) => {
                return authClient.organization.checkRolePermission({
                    role: role as OrgRole,
                    permissions: permission.permissions,
                });
            });
        },
        [userRoles, isSuperAdmin]
    );

    const { mutateAsync: updateMemberRoleMutation, isPending: isUpdatingRole } = useMutation({
        mutationFn: async ({ memberId, roles }: { memberId: string; roles: string[] }) => {
            return await authClient.organization.updateMemberRole({
                memberId,
                role: roles.join(","),
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
        },
    });

    const { mutateAsync: removeMemberMutation, isPending: isRemovingMember } = useMutation({
        mutationFn: async ({ memberId }: { memberId: string }) => {
            return await authClient.organization.removeMember({ memberIdOrEmail: memberId });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            await queryClient.invalidateQueries({ queryKey: ["activeOrganization"] });
        },
    });

    const listMembers = useCallback(async () => {
        return queryClient.refetchQueries({
            queryKey: ["organizationMembers"],
        });
    }, [queryClient]);

    const updateMemberRoles = useCallback(
        async (memberId: string, roles: string[]) => {
            return updateMemberRoleMutation({ memberId, roles });
        },
        [updateMemberRoleMutation]
    );

    const removeMember = useCallback(
        async (memberId: string) => {
            return removeMemberMutation({ memberId });
        },
        [removeMemberMutation]
    );

    return {
        members,
        loadingMembers: isPagedMode ? pagedQuery.isLoading : infiniteQuery.isLoading,
        nextCursor: isPagedMode ? (pagedQuery.data?.nextCursor ?? null) : null,
        prevCursor: isPagedMode ? (pagedQuery.data?.prevCursor ?? null) : null,
        hasNextPage: isPagedMode ? !!pagedQuery.data?.nextCursor : !!infiniteQuery.hasNextPage,
        hasPrevPage: isPagedMode ? !!pagedQuery.data?.prevCursor : false,
        isFetchingNextPage: isPagedMode ? pagedQuery.isFetching : infiniteQuery.isFetchingNextPage,
        userRoles,
        checkPermission,
        updateMemberRoles,
        removeMember,
        listMembers,
        isUpdatingRole,
        isRemovingMember,
        fetchNextPage: infiniteQuery.fetchNextPage,
    };
};
