import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
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
