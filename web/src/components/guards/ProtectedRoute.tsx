import { AppRoutes } from "@shared/constants/routes";
import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/features/auth";
import type React from "react";
import { Navigate, Outlet, useLocation } from "react-router";

interface ProtectedRouteProps {
    allowedRoles?: ("admin" | "user")[];
    allowedOrgRoles?: ("owner" | "admin" | "member")[];
    redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    allowedOrgRoles,
    redirectPath = AppRoutes.auth.signIn,
}) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <CenteredSpin />;
    }

    if (!isAuthenticated) {
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    // Check global roles
    if (allowedRoles && user && !allowedRoles.includes(user.globalRole)) {
        return <Navigate to={AppRoutes.unauthorized} replace />;
    }

    // Check organization roles
    if (allowedOrgRoles && user && (!user.orgRole || !allowedOrgRoles.includes(user.orgRole))) {
        return <Navigate to={AppRoutes.unauthorized} replace />;
    }

    return <Outlet />;
};
