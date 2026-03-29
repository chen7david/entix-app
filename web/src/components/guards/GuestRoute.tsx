import { AppRoutes } from "@shared";
import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/features/auth";
import type React from "react";
import { Navigate, Outlet } from "react-router";

interface GuestRouteProps {
    redirectPath?: string;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({
    redirectPath = AppRoutes.onboarding.selectOrganization,
}) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <CenteredSpin />;
    }

    if (isAuthenticated) {
        // Logged-in users are redirected to the home page (dashboard list/active org)
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};
