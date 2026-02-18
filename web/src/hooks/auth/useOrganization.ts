import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAuth } from "./auth.hook";
import { links } from "@web/src/constants/links";
import { useCallback } from "react";

// import { useContext } from "react";
import { useOrgContext } from "@web/src/context/OrgContext"; // Import context

export const useOrganization = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Try to consume context - might be undefined if outside OrgGuard
    // We treat it as optional here because this hook is used globally
    let contextVal;
    try {
        contextVal = useOrgContext();
    } catch (e) {
        // Not in provider
        contextVal = null;
    }

    // 1. Fetch user's organizations (Client-side source of truth for org list)
    // We always fetch the list because it's needed for the switcher and 'my organizations'
    const {
        data: organizations = [],
        isLoading: loadingOrganizations,
        isFetching: fetchingOrganizations
    } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const { data } = await authClient.organization.list();
            return data || [];
        }
    });

    // 2. Active Organization - derived strictly from Context if available
    const activeOrganization = contextVal?.activeOrganization || null;
    const loadingActiveOrg = contextVal?.loading || false;

    // Legacy active org fetch (only if NOT in context and we need to check session?)
    // User requested "No session reliance". So we rely on Context.
    // If not in context, activeOrganization is null. 
    // This is correct behavior for "Select Org" page.


    // 3. Organization Data Queries - scoped by ID
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

    const { mutate: createOrganizationMutation, isPending: isCreating } = useMutation({
        mutationFn: async (vars: { name: string; slug: string }) => {
            return await authClient.organization.create(vars);
        },
        onSuccess: async (result) => {
            if (result.data) {
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
                // Navigate to new URL-based route using slug
                navigate(links.dashboard.index(result.data.slug));
            }
        }
    });

    // const location = useLocation();

    const { mutateAsync: setActiveMutation, isPending: isSwitching } = useMutation({
        mutationFn: async (organizationId: string) => {
            return await authClient.organization.setActive({ organizationId });
        },
        onSuccess: async (result) => {
            if (result.data) {
                // Only invalidate cache — do NOT navigate here.
                // Navigation is the caller's responsibility.
                // Auto-navigating here caused "bounce back" when OrgGuard
                // called setActive on /orgs/:slug pages (Members, Invitations, etc).
                await queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
            }
        }
    });

    const listOrganizations = useCallback(async () => {
        return queryClient.refetchQueries({ queryKey: ['organizations'] });
    }, [queryClient]);

    const listMembers = useCallback(async () => {
        return queryClient.refetchQueries({ queryKey: ['organizationMembers', activeOrganization?.id] });
    }, [queryClient, activeOrganization?.id]);

    const getOrgLink = useCallback((path: string) => {
        if (activeOrganization?.slug) {
            return `/org/${activeOrganization.slug}${path.startsWith('/') ? path : `/${path}`}`;
        }
        return path;
    }, [activeOrganization?.slug]);

    const { session } = useAuth();
    const userId = session.data?.user?.id;

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


    const checkOrganizationStatus = async () => {
        // 1. Fetch and cache organizations
        const orgs = await queryClient.fetchQuery({
            queryKey: ['organizations'],
            queryFn: async () => {
                const { data } = await authClient.organization.list();
                return data || [];
            }
        });

        // 2. Fetch and cache active organization
        let activeOrg = await queryClient.fetchQuery({
            queryKey: ['activeOrganization'],
            queryFn: async () => {
                const { data } = await authClient.organization.getFullOrganization();
                return data || null;
            }
        });

        if (activeOrg?.slug) {
            navigate(links.dashboard.index(activeOrg.slug));
            return;
        }

        if (!orgs || orgs.length === 0) {
            navigate(links.context.noOrganization);
            return;
        }

        if (orgs.length === 1 && orgs[0].slug) {
            // 3. Set active organization
            await setActive(orgs[0].id);

            // 4. RE-FETCH active organization to ensure cache is updated and we have the data
            // We force a fetch to ensure we get the updated state from the server
            // activeOrg = await queryClient.fetchQuery({ ... }); // No need to fetch again to navigate, we have the slug

            navigate(links.dashboard.index(orgs[0].slug));
            return;
        }

        // More than 1 organization and no active one
        navigate(links.context.selectOrganization);
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

    const acceptInvitation = useCallback(async (invitationId: string) => {
        return acceptInvitationMutation(invitationId);
    }, [acceptInvitationMutation]);

    const updateMemberRoles = useCallback(async (memberId: string, roles: string[]) => {
        return updateMemberRoleMutation({ memberId, roles });
    }, [updateMemberRoleMutation]);

    const removeMember = useCallback(async (memberId: string) => {
        return removeMemberMutation({ memberId });
    }, [removeMemberMutation]);

    const inviteMember = useCallback(async (email: string, role: string) => {
        return inviteMemberMutation({ email, role });
    }, [inviteMemberMutation]);

    const cancelInvitation = useCallback(async (invitationId: string) => {
        return cancelInvitationMutation(invitationId);
    }, [cancelInvitationMutation]);

    const createOrganization = useCallback(async (name: string, slug: string) => {
        return createOrganizationMutation({ name, slug });
    }, [createOrganizationMutation]);

    const setActive = useCallback(async (organizationId: string) => {
        return setActiveMutation(organizationId);
    }, [setActiveMutation]);

    return {
        organizations,
        activeOrganization,
        members,
        invitations,
        userRoles,
        checkPermission,
        loading: loadingOrganizations || loadingActiveOrg || loadingMembers || loadingInvitations,
        isFetching: fetchingOrganizations,
        isCreating,
        isSwitching,
        isAcceptingInvitation,
        isInviting,
        isCancelingInvitation,
        listOrganizations,
        createOrganization,
        setActive,
        getOrgLink,
        listMembers,
        checkOrganizationStatus,
        acceptInvitation,
        updateMemberRoles,
        removeMember,
        inviteMember,
        cancelInvitation,
        isUpdatingRole,
        isRemovingMember,
    };
};
