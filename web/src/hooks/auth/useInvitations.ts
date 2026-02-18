import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useOrganization } from "./useOrganization";

export const useInvitations = () => {
    const queryClient = useQueryClient();
    const { activeOrganization, setActive } = useOrganization();

    const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
        queryKey: ['organizationInvitations', activeOrganization?.id],
        queryFn: async () => {
            if (!activeOrganization?.id) return [];
            const { data } = await authClient.organization.listInvitations({
                query: {
                    organizationId: activeOrganization.id,
                }
            });
            return data || [];
        },
        enabled: !!activeOrganization?.id
    });

    const { mutateAsync: inviteMemberMutation, isPending: isInviting } = useMutation({
        mutationFn: async ({ email, role }: { email: string; role: string }) => {
            return await authClient.organization.inviteMember({
                email,
                role: role as "member" | "admin" | "owner",
                organizationId: activeOrganization!.id
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['organizationInvitations'] });
        }
    });

    const { mutateAsync: cancelInvitationMutation, isPending: isCancelingInvitation } = useMutation({
        mutationFn: async (invitationId: string) => {
            return await authClient.organization.cancelInvitation({ invitationId });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['organizationInvitations'] });
        }
    });

    const { mutateAsync: acceptInvitationMutation, isPending: isAcceptingInvitation } = useMutation({
        mutationFn: async (invitationId: string) => {
            return await authClient.organization.acceptInvitation({ invitationId });
        },
        onSuccess: async (result) => {
            if (result.data) {
                // Invalidate queries to refresh organization list and active org
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
                await queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });

                // Set the accepted organization as active
                // We use the setActive from useOrganization to ensure consistency
                if (result.data.invitation?.organizationId) {
                    await setActive(result.data.invitation.organizationId);
                }
            }
        }
    });

    const inviteMember = useCallback(async (email: string, role: string) => {
        return inviteMemberMutation({ email, role });
    }, [inviteMemberMutation]);

    const cancelInvitation = useCallback(async (invitationId: string) => {
        return cancelInvitationMutation(invitationId);
    }, [cancelInvitationMutation]);

    const acceptInvitation = useCallback(async (invitationId: string) => {
        return acceptInvitationMutation(invitationId);
    }, [acceptInvitationMutation]);

    return {
        invitations,
        loadingInvitations,
        inviteMember,
        cancelInvitation,
        acceptInvitation,
        isInviting,
        isCancelingInvitation,
        isAcceptingInvitation,
    };
};
