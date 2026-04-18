import { AppRoutes } from "@shared";
import { STORAGE_KEYS } from "@web/src/lib/storageKeys";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useOrganization } from "../../organization/hooks/useOrganization";
import { useAuth } from "../context/AuthContext";

/**
 * useHomeRedirect
 *
 * Determines where an authenticated user landing on "/" should go.
 *
 * Priority order:
 *  1. sessionStorage breadcrumb — return to the last org the user visited in this tab.
 *  2. Single-org fast-path — skip the selector if there is only one org.
 *  3. Multi-org — send to the org selector.
 *  4. No orgs — send to onboarding.
 *
 * We deliberately do NOT call setActive() or checkOrganizationStatus() here.
 * OrgGuard owns the setActive + refreshAuth contract; this hook is only a router.
 *
 * @note organizations is already cached by useOrganization (staleTime 5 min),
 *       so this hook causes zero additional network requests after the first mount.
 *
 * After sign-in, `invalidateQueries` refetches the org list while keeping prior
 * cached data — `isSuccess` can stay true with a stale `[]` until the refetch
 * completes. Wait for `!orgsFetching` so we do not flash no-organization.
 */
export function useHomeRedirect() {
    const { isAuthenticated, isLoading: loadingAuth } = useAuth();
    const { organizations, orgsLoaded, orgsFetching } = useOrganization();
    const navigate = useNavigate();

    useEffect(() => {
        // Step 1: wait for auth to settle
        if (loadingAuth) return;

        // Step 2: unauthenticated users go straight to sign-in — no org data needed
        if (!isAuthenticated) {
            navigate(AppRoutes.auth.signIn, { replace: true });
            return;
        }

        // Step 3: authenticated — wait for a confirmed successful org fetch
        // isSuccess is only true after a real network response, immune to the
        // TanStack Query v5 "idle gap" where isPending=true but isFetching=false
        if (!orgsLoaded || orgsFetching) return;

        // Step 4: route based on confirmed org data
        const savedSlug = sessionStorage.getItem(STORAGE_KEYS.lastOrgSlug);
        if (savedSlug) {
            const matched = organizations.find((org) => org.slug === savedSlug);
            if (matched) {
                navigate(`/org/${matched.slug}${AppRoutes.org.dashboard.index}`, { replace: true });
                return;
            }
        }

        if (organizations.length === 0) {
            navigate(AppRoutes.onboarding.noOrganization, { replace: true });
            return;
        }

        if (organizations.length === 1) {
            navigate(`/org/${organizations[0].slug}${AppRoutes.org.dashboard.index}`, {
                replace: true,
            });
            return;
        }

        navigate(AppRoutes.onboarding.selectOrganization, { replace: true });
    }, [isAuthenticated, loadingAuth, orgsLoaded, orgsFetching, organizations, navigate]);
}
