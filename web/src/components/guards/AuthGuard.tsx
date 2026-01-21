import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@web/src/hooks/auth/auth.hook';
import { links } from '@web/src/constants/links';
import { Spin } from 'antd';

import { Outlet } from 'react-router';

export const AuthGuard: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate(`${links.auth.signIn}?returnUrl=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate, location]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <Outlet />;
};
