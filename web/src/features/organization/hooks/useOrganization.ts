import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrgContext } from "@web/src/context/OrgContext";
import { authClient } from "@web/src/lib/auth-client";
import { useCallback, useContext } from "react";
import { useAuth } from "../../auth/context/AuthContext";

export const useOrganization = () => {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    // Try to consume context - might be undefined if outside OrgGuard
    const contextVal = useContext(OrgContext);

    // 1. Fetch user's organizations
    const {
        data: organizations = [],
        isSuccess: orgsLoaded,
        isFetching: orgsFetching,
    } = useQuery({
        queryKey: ["organizations"],
        queryFn: async () => {
            const { data } = await authClient.organization.list();
            return data || [];
        },
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // consistent with OrgGuard — no re-fetch on tab focus
        refetchOnWindowFocus: false,
    });

    const activeOrganization = contextVal?.activeOrganization || null;

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

    const setActive = useCallback(
        async (organizationId: string) => {
            return setActiveMutation(organizationId);
        },
        [setActiveMutation]
    );

    return {
        organizations,
        activeOrganization,
        orgsLoaded,
        /** True while the org list request is in flight (including post-login refetch). */
        orgsFetching,
        isSwitching,
        setActive,
    };
};
