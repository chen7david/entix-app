import { AppRoutes } from "@shared";
import { useQueryClient } from "@tanstack/react-query";
import { CenteredResult, CenteredSpin } from "@web/src/components/common/CenteredView";
import { OrgProvider } from "@web/src/context/OrgContext";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization/hooks/useOrganization";
import { authClient } from "@web/src/lib/auth-client";
import { STORAGE_KEYS } from "@web/src/lib/storageKeys";
import { Button } from "antd";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";

/**
 * OrgGuard - Organization context guard and provider.
 *
 * The URL slug is the SINGLE source of truth for which organization is active.
 * We do NOT call getFullOrganization() to decide identity — we only call it
 * to detect a server-side mismatch and then fix it via setActive().
 *
 * Flow:
 *  1. Resolve org from URL slug against the cached org list.
 *  2. If org resolves and we haven't already synced this org id, call setActive()
 *     and refreshAuth() so that nested ProtectedRoutes see the correct orgRole.
 *  3. Persist the slug as a sessionStorage breadcrumb for useHomeRedirect.
 *  4. Render children only after sync completes (isSyncing barrier).
 */
export const OrgGuard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(true); // pessimistic default — block until first sync
    const lastSyncedOrgIdRef = useRef<string | null>(null);
    const auth = useAuth();

    // 1. Fetch the user's org list (cached; shared centrally via useOrganization)
    const { organizations, orgsLoaded } = useOrganization();

    // 2. Resolve org from URL slug (pure client-side; no extra network call)
    const activeOrganization =
        orgsLoaded && slug ? organizations.find((o) => o.slug === slug) || null : null;

    // 3. Persist breadcrumb so useHomeRedirect can return to this org on next load (in this tab)
    useEffect(() => {
        if (!activeOrganization?.slug) return;
        sessionStorage.setItem(STORAGE_KEYS.lastOrgSlug, activeOrganization.slug);
    }, [activeOrganization?.slug]);

    // 4. Sync server session to the URL-picked org.
    //    Guard with lastSyncedOrgIdRef so we don't re-sync on every render or background refetch.
    //    isSyncing starts as true so children never render before the first sync completes.
    // biome-ignore lint/correctness/useExhaustiveDependencies: URL-driven sync is stable by activeOrganization?.id
    useEffect(() => {
        if (!orgsLoaded) return; // wait for org list before deciding anything
        if (!activeOrganization) {
            // Org not found in the list — stop blocking so the 403 result can render
            setIsSyncing(false);
            return;
        }
        if (lastSyncedOrgIdRef.current === activeOrganization.id) {
            // Already synced this org; nothing to do
            setIsSyncing(false);
            return;
        }

        let cancelled = false;
        setIsSyncing(true);

        authClient.organization
            .setActive({ organizationId: activeOrganization.id })
            .then(async () => {
                if (cancelled) return;

                lastSyncedOrgIdRef.current = activeOrganization.id;

                // CRITICAL: refresh the session so nested ProtectedRoutes see the
                // correct orgRole before they evaluate allowedOrgRoles.
                await auth.refreshAuth();

                // Invalidate any query that reads from the session org context
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["better-auth"] }),
                    queryClient.invalidateQueries({ queryKey: ["session"] }),
                ]);
            })
            .catch((err) => {
                console.error("OrgGuard: failed to sync organization session:", err);
                // Reset the ref so a retry is possible on next render
                lastSyncedOrgIdRef.current = null;
            })
            .finally(() => {
                if (!cancelled) setIsSyncing(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeOrganization?.id, orgsLoaded, auth.refreshAuth, queryClient]);

    // Block children while resolving the org list or syncing the server session
    if (!orgsLoaded || isSyncing) {
        return <CenteredSpin />;
    }

    // 403 guard — org not found in the user's accessible list
    if (!activeOrganization) {
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
