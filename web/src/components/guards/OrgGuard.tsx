import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@web/src/lib/auth-client';
import { links } from '@web/src/constants/links';
import { Spin, Result, Button } from 'antd';
import { OrgProvider } from '@web/src/context/OrgContext';

/**
 * OrgGuard - Organization context guard and provider.
 *
 * Reads the `:slug` param from the URL, validates that the user has access
 * to the organization, syncs the server session if needed, and provides the
 * active organization via OrgContext to all child routes.
 *
 * The URL is the single source of truth for which organization is active.
 */
export const OrgGuard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const syncingRef = useRef(false);

    // 1. Fetch User's Organizations (to check access)
    const {
        data: organizations = [],
        isLoading: loadingOrgs,
    } = useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const { data } = await authClient.organization.list();
            return data || [];
        }
    });

    // 2. Resolve org from URL slug (client-side lookup from cached list)
    const activeOrganization = !loadingOrgs && slug
        ? organizations.find(o => o.slug === slug) || null
        : null;

    // 3. Fetch server's current active org to detect mismatches
    const { data: serverActiveOrgId } = useQuery({
        queryKey: ['serverActiveOrganizationId'],
        queryFn: async () => {
            const res = await fetch('/api/v1/users/active-org');
            if (!res.ok) return null;
            const data = await res.json();
            return data?.organizationId || null;
        },
        // Only fetch once we know which org the URL wants
        enabled: !!activeOrganization,
    });

    // 4. Sync server session when URL slug differs from server's active org
    useEffect(() => {
        if (!activeOrganization || syncingRef.current || serverActiveOrgId === undefined) return;

        // If server has no active org, or a different one by ID, sync it
        if (serverActiveOrgId !== activeOrganization.id) {
            syncingRef.current = true;
            fetch('/api/v1/users/active-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: activeOrganization.id })
            }).then(() => {
                // Update the server active org cache to reflect the sync
                queryClient.setQueryData(['serverActiveOrganizationId'], activeOrganization.id);
                queryClient.invalidateQueries({ queryKey: ['activeOrganization'] });
            }).finally(() => {
                syncingRef.current = false;
            });
        }
    }, [activeOrganization, serverActiveOrgId, queryClient]);

    // Loading State
    if (loadingOrgs) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" tip="Loading organization..." />
            </div>
        );
    }

    // Validation Guard
    if (!activeOrganization && !loadingOrgs) {
        return (
            <Result
                status="403"
                title="Access Denied"
                subTitle="You do not have access to this organization, or it does not exist."
                extra={<Button type="primary" onClick={() => navigate(links.onboarding.selectOrganization)}>Switch Organization</Button>}
            />
        );
    }

    // Provider — URL is the single source of truth for active org
    return (
        <OrgProvider value={{ activeOrganization, loading: false, error: null }}>
            <Outlet />
        </OrgProvider>
    );
};
