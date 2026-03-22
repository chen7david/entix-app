import { authClient } from "@web/src/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { AppRoutes } from "@shared/constants/routes";
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

    const { mutateAsync: setActiveMutation, isPending: isSwitching } = useMutation({
        mutationFn: async (organizationId: string) => {
            return await authClient.organization.setActive({ organizationId });
        },
        onSuccess: async (result) => {
            if (result.data) {
                await queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
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
        const activeOrg = await queryClient.fetchQuery({
            queryKey: ['activeOrganization'],
            queryFn: async () => {
                const { data } = await authClient.organization.getFullOrganization();
                return data || null;
            }
        });

        if (activeOrg?.slug) {
            navigate(`/org/${activeOrg.slug}${AppRoutes.org.dashboard.index}`);
            return;
        }

        if (!orgs || orgs.length === 0) {
            navigate(AppRoutes.onboarding.noOrganization);
            return;
        }

        if (orgs.length === 1 && orgs[0].slug) {
            // 3. Set active organization
            await setActive(orgs[0].id);
            navigate(`/org/${orgs[0].slug}${AppRoutes.org.dashboard.index}`);
            return;
        }

        // More than 1 organization and no active one
        navigate(AppRoutes.onboarding.selectOrganization);
    };

    const setActive = useCallback(async (organizationId: string) => {
        return setActiveMutation(organizationId);
    }, [setActiveMutation]);

    return {
        organizations,
        activeOrganization,
        loading: loadingOrganizations || loadingActiveOrg,
        isFetching: fetchingOrganizations,
        isSwitching,
        listOrganizations,
        setActive,
        getOrgLink,
        checkOrganizationStatus,
    };
};
