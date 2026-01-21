import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';
import { Spin } from 'antd';

export const GuestGuard: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate(links.dashboard.index, { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate]);

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
