import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrgContext } from "@web/src/context/OrgContext";
import { authClient } from "@web/src/lib/auth-client";
import { useCallback, useContext } from "react";

export const useOrganization = () => {
    const queryClient = useQueryClient();

    // Try to consume context - might be undefined if outside OrgGuard
    const contextVal = useContext(OrgContext);

    // 1. Fetch user's organizations
    const {
        data: organizations = [],
        isLoading: loadingOrganizations,
        isFetching: fetchingOrganizations,
    } = useQuery({
        queryKey: ["organizations"],
        queryFn: async () => {
            const { data } = await authClient.organization.list();
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // consistent with OrgGuard — no re-fetch on tab focus
        refetchOnWindowFocus: false,
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
                await queryClient.invalidateQueries({ queryKey: ["activeOrganization"] });
                await queryClient.invalidateQueries({ queryKey: ["organizations"] });
            }
        },
    });

    const listOrganizations = useCallback(async () => {
        return queryClient.refetchQueries({ queryKey: ["organizations"] });
    }, [queryClient]);

    // getOrgLink removed as per AppRoutes enforcing abstract context natively

    const setActive = useCallback(
        async (organizationId: string) => {
            return setActiveMutation(organizationId);
        },
        [setActiveMutation]
    );

    return {
        organizations,
        activeOrganization,
        loading: loadingOrganizations || loadingActiveOrg,
        isFetching: fetchingOrganizations,
        isSwitching,
        listOrganizations,
        setActive,
    };
};
