import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useSession } from '@web/src/lib/auth-client';
import { Spin, Result, Button } from 'antd';
import { links } from '@web/src/constants/links';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';

export const AdminLayout: React.FC = () => {
    const { data: session, isPending, error } = useSession();
    const { checkOrganizationStatus } = useOrganization();
    if (isPending) {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center min-h-screen">
                <Result
                    status="500"
                    title="500"
                    subTitle="Sorry, something went wrong."
                    extra={<Button type="primary" onClick={() => checkOrganizationStatus()}>Back Home</Button>}
                />
            </div>
        );
    }

    if (!session) {
        return <Navigate to={links.auth.signIn} replace />;
    }

    if (session.user.role !== 'admin') {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center min-h-screen">
                <Result
                    status="403"
                    title="403"
                    subTitle="Sorry, you are not authorized to access this page."
                    extra={<Button type="primary" onClick={() => checkOrganizationStatus()}>Back Home</Button>}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Outlet />
        </div>
    );
};
