import { AppRoutes } from "@shared";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useOrganization } from "../../organization/hooks/useOrganization";
import { useAuth } from "../context/AuthContext";

/**
 * useHomeRedirect - Decoupled hook for managing global navigation logic after auth states change.
 *
 * @note
 * Extracted from App.tsx to separate business/routing logic from component orchestration.
 * Handles:
 * 1. Guest redirect (unauthenticated users to sign-in)
 * 2. Active organization redirect
 * 3. Onboarding flows (no orgs, single org auto-select, multi-org select)
 */
export function useHomeRedirect() {
    const { isAuthenticated, isLoading: loadingAuth } = useAuth();
    const { checkOrganizationStatus, setActive } = useOrganization();
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const handleRedirect = async () => {
            if (loadingAuth) return;

            if (!isAuthenticated) {
                if (mounted) {
                    navigate(AppRoutes.auth.signIn, { replace: true });
                }
                return;
            }

            const result = await checkOrganizationStatus();
            if (!mounted || !result) return;
            const { orgs, activeOrg } = result;

            // 1. If there's already an active org, go there
            if (activeOrg?.slug) {
                navigate(`/org/${activeOrg.slug}${AppRoutes.org.dashboard.index}`, {
                    replace: true,
                });
                return;
            }

            // 2. If no orgs, go to onboarding
            if (!orgs || orgs.length === 0) {
                navigate(AppRoutes.onboarding.noOrganization, { replace: true });
                return;
            }

            // 3. If exactly one org, auto-select it and go to its dashboard
            if (orgs.length === 1 && orgs[0].slug) {
                await setActive(orgs[0].id);
                if (mounted) {
                    navigate(`/org/${orgs[0].slug}${AppRoutes.org.dashboard.index}`, {
                        replace: true,
                    });
                }
                return;
            }

            // 4. Otherwise, let the user select
            navigate(AppRoutes.onboarding.selectOrganization, { replace: true });
        };

        handleRedirect();

        return () => {
            mounted = false;
        };
    }, [isAuthenticated, loadingAuth, checkOrganizationStatus, navigate, setActive]);
}
