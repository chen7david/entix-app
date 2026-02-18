import React, { useEffect } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
// import { links } from '@web/src/constants/links'; // Unused now
import { Spin } from 'antd';

export const GuestGuard: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { checkOrganizationStatus } = useOrganization();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            checkOrganizationStatus();
        }
    }, [isLoading, isAuthenticated, checkOrganizationStatus]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" />
            </div>
        );
    }

    if (isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <Outlet />;
};
