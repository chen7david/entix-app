import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useCallback } from "react";
import { useOrganization } from "./useOrganization";

export const useMembers = () => {
    const queryClient = useQueryClient();
    const { activeOrganization } = useOrganization();
    const { session } = useAuth();
    const userId = session.data?.user?.id;

    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ['organizationMembers', activeOrganization?.id],
        queryFn: async () => {
            if (!activeOrganization?.id) return [];
            const { data } = await authClient.organization.listMembers({
                query: {
                    organizationId: activeOrganization.id,
                }
            });
            return data?.members || [];
        },
        enabled: !!activeOrganization?.id
    });

    const userRoles = (members?.find((m: any) => m.userId === userId)?.role || "").split(",").map((r: string) => r.trim()).filter(Boolean);

    // Helper to check permissions client-side using better-auth pattern
    const checkPermission = useCallback((permission: { permissions: Record<string, string[]> }) => {
        if (!userRoles.length) return false;

        return userRoles.some((role: string) => {
            return authClient.organization.checkRolePermission({
                role: role as any,
                permissions: permission.permissions
            });
        });
    }, [userRoles]);

    const { mutateAsync: updateMemberRoleMutation, isPending: isUpdatingRole } = useMutation({
        mutationFn: async ({ memberId, roles }: { memberId: string; roles: string[] }) => {
            // Join roles with comma
            return await authClient.organization.updateMemberRole({ memberId, role: roles.join(",") });
        },
        onSuccess: async () => {
            // Invalidate generically to ensuring list refresh
            await queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
        }
    });

    const { mutateAsync: removeMemberMutation, isPending: isRemovingMember } = useMutation({
        mutationFn: async ({ memberId }: { memberId: string }) => {
            return await authClient.organization.removeMember({ memberIdOrEmail: memberId });
        },
        onSuccess: async () => {
            // Invalidate generically to ensuring list refresh
            await queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
            // Also invalidate active organization in case the removed member was the current user (edge case)
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
    };
};
