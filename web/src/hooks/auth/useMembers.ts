import { authClient } from "@web/src/lib/auth-client";
import type { OrgRole } from "@shared/auth/permissions";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useCallback, useMemo } from "react";
import { useOrganization } from "./useOrganization";

const API_BASE = '/api/v1';

export const useMembers = (searchQuery?: string) => {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const { session, isSuperAdmin } = useAuth();
    const userId = session.data?.user?.id;

    const queryKey = ['organizationMembers', activeOrganization?.id, searchQuery];

    const { 
        data: membersPages, 
        isLoading: loadingMembers,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = undefined }) => {
            if (!activeOrganization?.id) return { items: [], nextCursor: null, prevCursor: null };
            
            const params = new URLSearchParams({ limit: '10' }); // UI prefers small pages
            if (pageParam) params.set('cursor', pageParam);
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`${API_BASE}/orgs/${activeOrganization.id}/users?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch members");
            
            return res.json();
        },
        getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined,
        enabled: !!activeOrganization?.id
    });

    // Safely flatten infinite scroll generic arrays mapping identically to previous UI structures natively.
    const members = useMemo(() => {
        if (!membersPages) return [];
        return membersPages.pages.flatMap((p: any) => p.items);
    }, [membersPages]);

    const userRoles = useMemo(() => {
        return (members.find((m: any) => m.userId === userId)?.role || "").split(",").map((r: string) => r.trim()).filter(Boolean);
    }, [members, userId]);

    const checkPermission = useCallback((permission: { permissions: Record<string, string[]> }) => {
        if (isSuperAdmin) return true;
        if (!userRoles.length) return false;

        return userRoles.some((role: string) => {
            return authClient.organization.checkRolePermission({
                role: role as OrgRole,
                permissions: permission.permissions
            });
        });
    }, [userRoles, isSuperAdmin]);

    const { mutateAsync: updateMemberRoleMutation, isPending: isUpdatingRole } = useMutation({
        mutationFn: async ({ memberId, roles }: { memberId: string; roles: string[] }) => {
            return await authClient.organization.updateMemberRole({ memberId, role: roles.join(",") });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
        }
    });

    const { mutateAsync: removeMemberMutation, isPending: isRemovingMember } = useMutation({
        mutationFn: async ({ memberId }: { memberId: string }) => {
            return await authClient.organization.removeMember({ memberIdOrEmail: memberId });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
            await queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });
        }
    });

    const listMembers = useCallback(async () => {
        return queryClient.refetchQueries({ queryKey: ['organizationMembers', activeOrganization?.id] });
    }, [queryClient, activeOrganization?.id]);

    const updateMemberRoles = useCallback(async (memberId: string, roles: string[]) => {
        return updateMemberRoleMutation({ memberId, roles });
    }, [updateMemberRoleMutation]);

    const removeMember = useCallback(async (memberId: string) => {
        return removeMemberMutation({ memberId });
    }, [removeMemberMutation]);

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
        isFetchingNextPage
    };
};
