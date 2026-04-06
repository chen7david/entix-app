import { AppRoutes } from "@shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CenteredResult, CenteredSpin } from "@web/src/components/common/CenteredView";
import { OrgProvider } from "@web/src/context/OrgContext";
import { useAuth } from "@web/src/features/auth";
import { authClient } from "@web/src/lib/auth-client";
import { Button } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";

/**
 * OrgGuard - Organization context guard and provider.
 *
 * Reads the `:slug` param from the URL, validates that the user has access
 * to the organization, syncs the server session if needed, and provides the
 * active organization via OrgContext to all child routes.
 *
 * The URL is the single source of truth for which organization is active.
 */
export const OrgGuard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);
    const auth = useAuth();

    // 1. Fetch User's Organizations (to check access)
    const { data: organizations = [], isLoading: loadingOrgs } = useQuery({
        queryKey: ["organizations"],
        queryFn: async () => {
            const { data } = await authClient.organization.list();
            return data || [];
        },
    });

    // 2. Resolve org from URL slug (client-side lookup from cached list)
    const activeOrganization =
        !loadingOrgs && slug ? organizations.find((o) => o.slug === slug) || null : null;

    // 3. Fetch server's current active org to detect mismatches
    const { data: serverActiveOrg, isLoading: serverOrgInitialLoading } = useQuery({
        queryKey: ["serverActiveOrganization"],
        queryFn: async () => {
            const { data } = await authClient.organization.getFullOrganization();
            return data || null;
        },
        // Only fetch once we know which org the URL wants
        enabled: !!activeOrganization,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // 4. Sync server session when URL slug differs from server's active org.
    // This prevents "Authentication race conditions" where nested ProtectedRoutes
    // evaluate against a stale session (no orgRole) before the server has been
    // notified of the tenant change from the URL.

    // isLoading in RQ v5 = isPending && isFetching (only true when NO cache exists yet).
    // Background refetches keep data defined — no spinner triggered.
    const isMismatch =
        activeOrganization &&
        serverActiveOrg !== undefined &&
        (serverActiveOrg === null || serverActiveOrg.slug !== activeOrganization.slug);

    useEffect(() => {
        if (!activeOrganization || isSyncing) return;

        // If server has no active org (null), or a different one, sync it
        if (isMismatch) {
            setIsSyncing(true);
            authClient.organization
                .setActive({
                    organizationId: activeOrganization.id,
                })
                .then(async () => {
                    // Update the server active org cache to reflect the sync
                    queryClient.setQueryData(["serverActiveOrganization"], activeOrganization);

                    // CRITICAL: Explicitly refetch the session and member data.
                    // This is the officially supported workaround for Better Auth hooks
                    // not automatically updating when organization context changes.
                    await auth.refreshAuth();

                    // Optional: Keep broad invalidation as a fallback for any custom queries
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ["better-auth"] }),
                        queryClient.invalidateQueries({ queryKey: ["session"] }),
                    ]);
                })
                .catch((err) => {
                    console.error("Critical: Failed to sync organization session:", err);
                })
                .finally(() => {
                    setIsSyncing(false);
                });
        }
    }, [activeOrganization, isMismatch, queryClient, isSyncing, auth.refreshAuth]);

    // Loading State: Block children while fetching list, awaiting first org fetch, or syncing session
    if (loadingOrgs || isSyncing || serverOrgInitialLoading || isMismatch) {
        return <CenteredSpin />;
    }

    // Validation Guard
    if (!activeOrganization && !loadingOrgs) {
        return (
            <CenteredResult
                status="403"
                title="Access Denied"
                subTitle="You do not have access to this organization, or it does not exist."
                extra={
                    <Button
                        type="primary"
                        onClick={() => navigate(AppRoutes.onboarding.selectOrganization)}
                    >
                        Switch Organization
                    </Button>
                }
            />
        );
    }

    // Provider — URL is the single source of truth for active org
    return (
        <OrgProvider value={{ activeOrganization, loading: false, error: null }}>
            <Outlet />
        </OrgProvider>
    );
};
