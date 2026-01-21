import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router";

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

    return {
        organizations,
        activeOrganization,
        members,
        loading: loadingOrganizations || loadingActiveOrg || loadingMembers,
        isCreating,
        isSwitching,
        listOrganizations,
        createOrganization,
        setActive,
        getOrgLink,
        listMembers,
    };
};
