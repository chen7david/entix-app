import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router';
import { useOrganization } from '@web/src/hooks/auth/useOrganization.ts';
import { links } from '@web/src/constants/links';
import { Spin } from 'antd';

export const OrganizationGuard: React.FC = () => {
    const { activeOrganization, organizations, loading, isFetching, setActive } = useOrganization();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for initial load OR background fetch if we have no data yet
        if (loading || (isFetching && (!organizations || organizations.length === 0))) return;

        if (activeOrganization) {
            return;
        }

        // No active organization
        if (!organizations || organizations.length === 0) {
            navigate(links.context.noOrganization, { replace: true });
            return;
        }

        if (organizations.length === 1) {
            // Auto-select the only organization
            setActive(organizations[0].id).then(() => {
                // Stay on the current page if possible, or go to dashboard
                // Since we are in the guard, we are likely trying to access a protected route
                // Just letting it render Outlet after state update might be enough, 
                // but setActive is async.
                // The hook's setActiveMutation invalidates queries, so activeOrganization should update.
            });
            return;
        }

        // More than 1 organization
        navigate(links.context.selectOrganization, { replace: true });

    }, [loading, isFetching, activeOrganization, organizations, navigate, setActive]);

    if (loading || (isFetching && (!organizations || organizations.length === 0)) || (!activeOrganization && organizations.length === 1)) {
        // Show spinner while loading or auto-selecting
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" />
            </div>
        );
    }

    if (!activeOrganization) {
        return null; // Will redirect
    }

    return <Outlet />;
};
