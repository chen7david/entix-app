import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';
import { Spin, Result, Button } from 'antd';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';

/**
 * Guard component that restricts access to admin-only routes.
 * Must be nested inside AuthGuard (requires authenticated session).
 * Renders Outlet for admin users, shows 403 for non-admins.
 */
export const AdminGuard: React.FC = () => {
    const { session, isLoading } = useAuth();
    const { checkOrganizationStatus } = useOrganization();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" />
            </div>
        );
    }

    if (!session.data?.user) {
        return <Navigate to={links.auth.signIn} replace />;
    }

    if (session.data.user.role !== 'admin') {
        return (
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={<Button type="primary" onClick={() => checkOrganizationStatus()}>Back to Dashboard</Button>}
            />
        );
    }

    return <Outlet />;
};
