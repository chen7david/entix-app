import React from 'react';
import { useNavigate, useParams, Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@web/src/lib/auth-client';
import { links } from '@web/src/constants/links';
import { Spin, Result, Button } from 'antd';
import { OrgProvider } from '@web/src/context/OrgContext';

export const OrgLayout: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // 1. Fetch User's Organizations (to check access)
    // We fetch this here to ensure we have the list for validation, but specific org details come from slug
    // This query is cached by 'organizations' key, shared with useOrganization hook
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

    // 2. Fetch Active Organization Details based on SLUG
    // This is the source of truth for the CURRENT organization context
    const {
        data: activeOrganization,
        isLoading: loadingActiveOrg,
    } = useQuery({
        queryKey: ['organizationBySlug', slug],
        queryFn: async () => {
            if (!slug) return null;
            // Use list to find the org by slug
            const org = organizations.find(o => o.slug === slug);
            if (org) {
                return org;
            }
            return null;
        },
        enabled: !loadingOrgs && !!slug
    });


    // Loading State
    if (loadingOrgs || (slug && loadingActiveOrg)) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" tip="Loading organization..." />
            </div>
        );
    }

    // Validation Guard
    if (!slug || !activeOrganization) {
        // If organizations are loaded and we still don't have activeOrganization, it means 404/403
        // Check if it's strictly 404 (not in list)
        // If it's not in the list, it's either 404 or 403 (user not member).
        // Since list() returns only member orgs, we can't distinguish 404 vs 403 easily without another call.
        // But for the user, "Access Denied" or "Not Found" is effectively similar if they can't access it.
        const hasAccess = organizations.some(o => o.slug === slug);

        if (!hasAccess && !loadingOrgs) {
            return (
                <Result
                    status="403"
                    title="Access Denied"
                    subTitle="You do not have access to this organization."
                    extra={<Button type="primary" onClick={() => navigate(links.context.selectOrganization)}>Switch Organization</Button>}
                />
            );
        }

        // Fallback generic error activeOrganization is null but slug exists and hasAccess is true?
        // Should not happen if logic above is correct, unless organizations is empty but hasAccess is somehow true (impossible).
        // Actually if slug is valid but activeOrganization is null (e.g. find failed?), but hasAccess is true?
        // find() logic is same as hasAccess logic.

        return <Result status="404" title="Organization Not Found" />;
    }

    // Provider
    return (
        <OrgProvider value={{ activeOrganization: activeOrganization, loading: false, error: null }}>
            <Outlet />
        </OrgProvider>
    );
};
