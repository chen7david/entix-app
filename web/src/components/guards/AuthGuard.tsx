import { AppRoutes } from "@shared/constants/routes";
import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/hooks/auth/useAuth";
import type React from "react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

export const AuthGuard: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate(
                `${AppRoutes.auth.signIn}?returnUrl=${encodeURIComponent(location.pathname + location.search)}`,
                { replace: true }
            );
        }
    }, [isLoading, isAuthenticated, navigate, location]);

    if (isLoading) {
        return <CenteredSpin />;
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <Outlet />;
};
