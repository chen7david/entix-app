import { API_V1, type MemberDTO, type OrgRole, type PaginatedResponse } from "@shared";
import {
    type InfiniteData,
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@web/src/features/auth";
import { authClient } from "@web/src/lib/auth-client";
import { parseApiError } from "@web/src/utils/api";
import { useCallback, useMemo } from "react";
import { useOrganization } from "./useOrganization";

export const useMembers = (searchQuery?: string) => {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const { isSuperAdmin } = useAuth();

    const queryKey = ["organizationMembers", activeOrganization?.id, searchQuery];

    const {
        data: membersPages,
        isLoading: loadingMembers,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<
        PaginatedResponse<MemberDTO>,
        Error,
        InfiniteData<PaginatedResponse<MemberDTO>>,
        string[],
        string | undefined
    >({
        queryKey,
        queryFn: async ({ pageParam }) => {
            if (!activeOrganization?.id)
                return { items: [], total: 0, nextCursor: null, prevCursor: null };

            const params = new URLSearchParams({ limit: "10" }); // UI prefers small pages
            if (pageParam) params.set("cursor", pageParam);
            if (searchQuery) params.set("search", searchQuery);

            const res = await fetch(
                `${API_V1}/orgs/${activeOrganization.id}/users?${params.toString()}`
            );
            if (!res.ok) await parseApiError(res);

            return (await res.json()) as PaginatedResponse<MemberDTO>;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined,
        enabled: !!activeOrganization?.id,
        placeholderData: keepPreviousData,
    });

    // Safely flatten infinite scroll generic arrays mapping identically to previous UI structures natively.
    const members = useMemo(() => {
        if (!membersPages) return [];
        return membersPages.pages.flatMap((p) => p.items);
    }, [membersPages]);

    // Securely acquire the current member's role via BetterAuth reactive primitive session context.
    // This avoids race conditions where searching the paginated/filtered members array failed if you weren't on Page 1.
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
            queryKey: ["organizationMembers", activeOrganization?.id],
        });
    }, [queryClient, activeOrganization?.id]);

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
        loadingMembers,
        userRoles,
        checkPermission,
        updateMemberRoles,
        removeMember,
        listMembers,
        isUpdatingRole,
        isRemovingMember,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
};
