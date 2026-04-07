import { AppRoutes } from "@shared";
import { STORAGE_KEYS } from "@web/src/lib/storageKeys";
import { useEffect, useRef } from "react";
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
 */
export function useHomeRedirect() {
    const { isAuthenticated, isLoading: loadingAuth } = useAuth();
    const { organizations, loading: loadingOrgs } = useOrganization();
    const navigate = useNavigate();
    const hasNavigatedRef = useRef(false);

    useEffect(() => {
        if (hasNavigatedRef.current) return;

        // Wait for both auth and org list to settle
        if (loadingAuth || loadingOrgs) return;

        hasNavigatedRef.current = true;

        if (!isAuthenticated) {
            navigate(AppRoutes.auth.signIn, { replace: true });
            return;
        }

        // 1. Breadcrumb — return to the last org this tab was on
        const savedSlug = sessionStorage.getItem(STORAGE_KEYS.lastOrgSlug);
        if (savedSlug) {
            const matched = organizations.find((org) => org.slug === savedSlug);
            if (matched) {
                navigate(`/org/${matched.slug}${AppRoutes.org.dashboard.index}`, {
                    replace: true,
                });
                return;
            }
        }

        // 2. No orgs → onboarding
        if (organizations.length === 0) {
            navigate(AppRoutes.onboarding.noOrganization, { replace: true });
            return;
        }

        // 3. Single org → go straight in (OrgGuard handles the setActive)
        if (organizations.length === 1) {
            navigate(`/org/${organizations[0].slug}${AppRoutes.org.dashboard.index}`, {
                replace: true,
            });
            return;
        }

        // 4. Multiple orgs → let the user choose
        navigate(AppRoutes.onboarding.selectOrganization, { replace: true });
    }, [isAuthenticated, loadingAuth, loadingOrgs, organizations, navigate]);
}
