import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "./auth.hook";
import { links } from "@web/src/constants/links";

export const useOrganization = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: organizations = [], isLoading: loadingOrganizations } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const { data } = await authClient.organization.list();
            return data || [];
        }
    });

    const { data: activeOrganization, isLoading: loadingActiveOrg } = useQuery({
        queryKey: ['activeOrganization'],
        queryFn: async () => {
            const { data } = await authClient.organization.getFullOrganization();
            return data || null;
        }
    });

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

    const { mutateAsync: createOrganizationMutation, isPending: isCreating } = useMutation({
        mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
            return await authClient.organization.create({ name, slug });
        },
        onSuccess: async (result) => {
            if (result.data) {
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
                navigate(`/organization/${result.data.id}`);
            }
        }
    });

    const location = useLocation();

    const { mutateAsync: setActiveMutation, isPending: isSwitching } = useMutation({
        mutationFn: async (organizationId: string) => {
            return await authClient.organization.setActive({ organizationId });
        },
        onSuccess: async (result, variables) => {
            if (result.data) {
                await queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });
                // We also invalidate members because the active organization changed, 
                // and the members query depends on activeOrganization.id, so it will automatically refetch.
                // But explicit invalidation is safer if keys overlap.
                await queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });

                // If the current URL contains the old organization ID, update it to the new one
                if (activeOrganization?.id && location.pathname.includes(activeOrganization.id)) {
                    const newPath = location.pathname.replace(activeOrganization.id, variables);
                    navigate(newPath);
                }
            }
        }
    });

    const createOrganization = async (name: string, slug: string) => {
        return createOrganizationMutation({ name, slug });
    };

    const setActive = async (organizationId: string) => {
        return setActiveMutation(organizationId);
    };

    const listOrganizations = async () => {
        return queryClient.refetchQueries({ queryKey: ['organizations'] });
    };

    const listMembers = async () => {
        return queryClient.refetchQueries({ queryKey: ['organizationMembers', activeOrganization?.id] });
    };

    const getOrgLink = (path: string) => {
        if (activeOrganization?.id) {
            return `/organization/${activeOrganization.id}${path.startsWith('/') ? path : `/${path}`}`;
        }
        return path;
    };

    const { session } = useAuth();
    const userId = session.data?.user?.id;

    const userRole = activeOrganization?.members?.find((m: any) => m.userId === userId)?.role;

    const checkOrganizationStatus = async () => {
        // We need to fetch fresh data
        const { data: orgs } = await authClient.organization.list();
        const { data: activeOrg } = await authClient.organization.getFullOrganization();

        if (activeOrg) {
            navigate(links.dashboard.index);
            return;
        }

        if (!orgs || orgs.length === 0) {
            navigate(links.auth.noOrganization);
            return;
        }

        if (orgs.length === 1) {
            await setActive(orgs[0].id);
            navigate(links.dashboard.index);
            return;
        }

        // More than 1 organization and no active one
        navigate(links.auth.selectOrganization);
    };

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
                if (result.data.invitation?.organizationId) {
                    await setActiveMutation(result.data.invitation.organizationId);
                }
            }
        }
    });

    const acceptInvitation = async (invitationId: string) => {
        return acceptInvitationMutation(invitationId);
    };

    return {
        organizations,
        activeOrganization,
        members,
        userRole,
        loading: loadingOrganizations || loadingActiveOrg || loadingMembers,
        isCreating,
        isSwitching,
        isAcceptingInvitation,
        listOrganizations,
        createOrganization,
        setActive,
        getOrgLink,
        listMembers,
        checkOrganizationStatus,
        acceptInvitation,
    };
};
