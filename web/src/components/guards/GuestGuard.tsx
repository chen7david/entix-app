import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/hooks/auth/useAuth";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import type React from "react";
import { useEffect } from "react";
import { Outlet } from "react-router";

export const GuestGuard: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { checkOrganizationStatus } = useOrganization();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            checkOrganizationStatus();
        }
    }, [isLoading, isAuthenticated, checkOrganizationStatus]);

    if (isLoading) {
        return <CenteredSpin />;
    }

    if (isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <Outlet />;
};
