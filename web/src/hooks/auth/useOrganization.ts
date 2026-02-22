import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { links } from "@web/src/constants/links";
import { useCallback } from "react";
import { useOrgContext } from "@web/src/context/OrgContext";

export const useOrganization = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Try to consume context - might be undefined if outside OrgGuard
    let contextVal;
    try {
        contextVal = useOrgContext();
    } catch (e) {
        contextVal = null;
    }

    // 1. Fetch user's organizations
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

    const { mutateAsync: createOrganizationMutation, isPending: isCreating } = useMutation({
        mutationFn: async (vars: { name: string; slug: string }) => {
            return await authClient.organization.create(vars);
        },
        onSuccess: async (result) => {
            if (result.data) {
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
                navigate(links.dashboard.index(result.data.slug));
            }
        }
    });

    const { mutateAsync: setActiveMutation, isPending: isSwitching } = useMutation({
        mutationFn: async (organizationId: string) => {
            const res = await fetch('/api/v1/users/active-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId })
            });
            if (!res.ok) throw new Error('Failed to set active organization');
            return await res.json();
        },
        onSuccess: async (result) => {
            if (result.success) {
                // We use setTimeout so that the DB's session update takes priority over any subsequent DB queries
                setTimeout(async () => {
                    await queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });
                    await queryClient.invalidateQueries({ queryKey: ['organizations'] });
                }, 100);
            }
        }
    });

    const listOrganizations = useCallback(async () => {
        return queryClient.refetchQueries({ queryKey: ['organizations'] });
    }, [queryClient]);

    const getOrgLink = useCallback((path: string) => {
        if (activeOrganization?.slug) {
            return `/org/${activeOrganization.slug}${path.startsWith('/') ? path : `/${path}`}`;
        }
        return path;
    }, [activeOrganization?.slug]);

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
        const activeOrgId = await queryClient.fetchQuery({
            queryKey: ['serverActiveOrganizationId'],
            queryFn: async () => {
                const res = await fetch('/api/v1/users/active-org');
                if (!res.ok) return null;
                const data = await res.json();
                return data?.organizationId || null;
            }
        });

        const activeOrg = orgs.find(o => o.id === activeOrgId) || null;

        if (activeOrg?.slug) {
            navigate(links.dashboard.index(activeOrg.slug));
            return;
        }

        if (!orgs || orgs.length === 0) {
            navigate(links.onboarding.noOrganization);
            return;
        }

        if (orgs.length === 1 && orgs[0].slug) {
            // 3. Set active organization
            await setActive(orgs[0].id);
            navigate(links.dashboard.index(orgs[0].slug));
            return;
        }

        // More than 1 organization and no active one
        navigate(links.onboarding.selectOrganization);
    };

    const createOrganization = useCallback(async (name: string, slug: string) => {
        return createOrganizationMutation({ name, slug });
    }, [createOrganizationMutation]);

    const setActive = useCallback(async (organizationId: string) => {
        return setActiveMutation(organizationId);
    }, [setActiveMutation]);

    return {
        organizations,
        activeOrganization,
        loading: loadingOrganizations || loadingActiveOrg,
        isFetching: fetchingOrganizations,
        isCreating,
        isSwitching,
        listOrganizations,
        createOrganization,
        setActive,
        getOrgLink,
        checkOrganizationStatus,
    };
};
