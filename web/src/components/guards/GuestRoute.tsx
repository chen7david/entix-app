import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/features/auth";
import type React from "react";
import { Navigate, Outlet, useLocation } from "react-router";

interface GuestRouteProps {
    redirectPath?: string;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({ redirectPath = "/" }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <CenteredSpin />;
    }

    if (isAuthenticated) {
        // If the user was redirected here from a protected route, send them back.
        // Otherwise, send them to the default redirect path (usually /).
        const from =
            (location.state as { from?: { pathname: string } })?.from?.pathname || redirectPath;
        return <Navigate to={from} replace />;
    }

    return <Outlet />;
};
