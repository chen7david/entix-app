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
import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";

/**
 * OrgGuard - Organization context guard and provider.
 *
 * Full guard ordering and non-redundancy rules: see `components/guards/index.ts`.
 *
 * The URL slug is the SINGLE source of truth for which organization is active.
 * We do NOT call getFullOrganization() to decide identity — we only call it
 * to detect a server-side mismatch and then fix it via setActive().
 *
 * Flow:
 *  1. Resolve org from URL slug against the cached org list.
 *  2. If org resolves and we haven't already synced this org id, call setActive()
 *     and refreshAuth() so that nested ProtectedRoutes see the correct orgRole.
 *  3. Persist the slug as a localStorage breadcrumb for useHomeRedirect.
 *  4. Render children only after sync completes (isSyncing barrier).
 */
export const OrgGuard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(true); // pessimistic default — block until first sync
    const [syncFailed, setSyncFailed] = useState(false);
    const [isRoleSwitching, setIsRoleSwitching] = useState(false);
    const [activeRole, setActiveRoleState] = useState<string | null>(() =>
        slug ? localStorage.getItem(`activeRole:${slug}`) : null
    );
    const prevSlugRef = useRef(slug);
    const lastSyncedOrgIdRef = useRef<string | null>(null);
    const roleSwitchTargetRef = useRef<string | null>(null);
    const auth = useAuth();
    const { refreshAuth } = auth;

    // 1. Fetch the user's org list (cached; shared centrally via useOrganization)
    const { organizations, orgsLoaded, orgsFetching } = useOrganization();

    // 2. Resolve org from URL slug (pure client-side; no extra network call)
    const orgListSettled = orgsLoaded && !orgsFetching;
    const activeOrganization =
        orgListSettled && slug ? organizations.find((o) => o.slug === slug) || null : null;
    const activeOrganizationId = activeOrganization?.id ?? null;

    useEffect(() => {
        if (slug === prevSlugRef.current) {
            return;
        }
        prevSlugRef.current = slug;
        if (!slug) {
            setActiveRoleState(null);
            return;
        }
        setActiveRoleState(localStorage.getItem(`activeRole:${slug}`));
    }, [slug]);

    const setActiveRole = useCallback(
        (role: string | null) => {
            if (!slug) return;
            const key = `activeRole:${slug}`;
            if (role) {
                roleSwitchTargetRef.current = role;
                setIsRoleSwitching(true);
                localStorage.setItem(key, role);
                setActiveRoleState(role);
            } else {
                roleSwitchTargetRef.current = null;
                setIsRoleSwitching(false);
                localStorage.removeItem(key);
                setActiveRoleState(null);
            }
        },
        [slug]
    );

    // Navigate only after React has committed the new active role so nested
    // ProtectedRoute checks do not briefly see the new role on the old URL.
    useEffect(() => {
        if (!isRoleSwitching || !slug || !roleSwitchTargetRef.current) return;
        if (activeRole !== roleSwitchTargetRef.current) return;

        navigate(`/org/${slug}${AppRoutes.org.dashboard.index}`, { replace: true });
    }, [isRoleSwitching, activeRole, slug, navigate]);

    const orgDashboardPath = slug ? `/org/${slug}${AppRoutes.org.dashboard.index}` : null;

    useEffect(() => {
        if (!isRoleSwitching || !orgDashboardPath) return;
        if (location.pathname !== orgDashboardPath) return;

        roleSwitchTargetRef.current = null;
        setIsRoleSwitching(false);
    }, [isRoleSwitching, location.pathname, orgDashboardPath]);

    // 3. Persist breadcrumb so useHomeRedirect can return to this org on next load (after refresh)
    useEffect(() => {
        if (!activeOrganization?.slug) return;
        localStorage.setItem(STORAGE_KEYS.lastOrgSlug, activeOrganization.slug);
    }, [activeOrganization?.slug]);

    // Imperative sync so Retry can re-run setActive without inventing fake effect deps.
    const syncOrgSession = useCallback(
        async (orgId: string, signal?: { cancelled: boolean }) => {
            setIsSyncing(true);
            setSyncFailed(false);
            try {
                await authClient.organization.setActive({ organizationId: orgId });
                if (signal?.cancelled) return;

                lastSyncedOrgIdRef.current = orgId;

                // CRITICAL: refresh the session so nested ProtectedRoutes see the
                // correct orgRole before they evaluate allowedOrgRoles.
                await refreshAuth();
                if (signal?.cancelled) return;

                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["better-auth"] }),
                    queryClient.invalidateQueries({ queryKey: ["session"] }),
                ]);
            } catch (err) {
                console.error("OrgGuard: failed to sync organization session:", err);
                lastSyncedOrgIdRef.current = null;
                if (!signal?.cancelled) setSyncFailed(true);
            } finally {
                if (!signal?.cancelled) setIsSyncing(false);
            }
        },
        [refreshAuth, queryClient]
    );

    // 4. Sync server session to the URL-picked org.
    //    Guard with lastSyncedOrgIdRef so we don't re-sync on every render or background refetch.
    //    isSyncing starts as true so children never render before the first sync completes.
    useEffect(() => {
        if (!orgsLoaded || orgsFetching) return; // wait for settled org list
        if (!activeOrganizationId) {
            // Org not found in the list — stop blocking so the 403 result can render
            setIsSyncing(false);
            return;
        }
        if (lastSyncedOrgIdRef.current === activeOrganizationId) {
            // Already synced this org; nothing to do
            setIsSyncing(false);
            return;
        }

        const signal = { cancelled: false };
        void syncOrgSession(activeOrganizationId, signal);
        return () => {
            signal.cancelled = true;
        };
    }, [activeOrganizationId, orgsLoaded, orgsFetching, syncOrgSession]);

    // Block children while resolving the org list, syncing the server session, or switching role
    if (!orgsLoaded || orgsFetching || isSyncing || isRoleSwitching) {
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

    // Do not mount org routes with a stale Better Auth session after sync failure
    if (syncFailed) {
        return (
            <CenteredResult
                status="error"
                title="Organization sync failed"
                subTitle="We could not activate this organization in your session. Please try again or switch organizations."
                extra={
                    <Button
                        type="primary"
                        onClick={() => {
                            lastSyncedOrgIdRef.current = null;
                            void syncOrgSession(activeOrganization.id);
                        }}
                    >
                        Retry
                    </Button>
                }
            />
        );
    }

    // Provider — URL is the single source of truth for active org
    return (
        <OrgProvider
            value={{ activeOrganization, loading: false, error: null, activeRole, setActiveRole }}
        >
            <Outlet />
        </OrgProvider>
    );
};
