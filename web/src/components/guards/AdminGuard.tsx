import { CenteredResult } from "@web/src/components/common/CenteredView";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { Button } from "antd";
import type React from "react";
import { Outlet } from "react-router";

/**
 * Guard component that restricts access to admin-only routes.
 * Must be nested inside AuthGuard (requires authenticated session).
 * Renders Outlet for admin users, shows 403 for non-admins.
 */
export const AdminGuard: React.FC = () => {
    const { isSuperAdmin } = useAuth();
    const { checkOrganizationStatus } = useOrganization();

    // Note: isLoading and session existence are already guaranteed by the parent AuthGuard.

    if (!isSuperAdmin) {
        return (
            <CenteredResult
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={
                    <Button type="primary" onClick={() => checkOrganizationStatus()}>
                        Back to Dashboard
                    </Button>
                }
            />
        );
    }

    return <Outlet />;
};
