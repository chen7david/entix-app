import React, { useEffect } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { Spin, Result, Button } from 'antd';
import { links } from '@web/src/constants/links';

export const OrganizationSlugGuard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { activeOrganization, organizations, loading, isFetching, setActive, isFetchingActiveOrg } = useOrganization();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading || !slug || isFetchingActiveOrg) return;

        // If we are already in the correct organization, do nothing
        if (activeOrganization?.slug === slug) {
            return;
        }

        // Find the organization with this slug
        const targetOrg = organizations.find(org => org.slug === slug);

        if (targetOrg) {
            // Switch to it
            setActive(targetOrg.id);
        }

        // If targetOrg is not found, we let the render logic handle the 404
    }, [slug, activeOrganization, organizations, loading, setActive, isFetchingActiveOrg]);

    if (loading || (isFetching && !organizations.length)) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" />
            </div>
        );
    }

    // If we have an active organization but it doesn't match the slug, 
    // we are likely in the process of switching (useEffect triggered)
    // Show spinner to prevent flash of wrong content
    if (activeOrganization?.slug !== slug && organizations.some(org => org.slug === slug)) {
        return (
            <div className="flex justify-center items-center h-screen w-full">
                <Spin size="large" tip="Switching organization..." />
            </div>
        );
    }

    // 404 Case: Organization not found in user's list
    if (!organizations.some(org => org.slug === slug)) {
        return (
            <Result
                status="404"
                title="Organization Not Found"
                subTitle="You are not a member of this organization or it does not exist."
                extra={
                    <Button type="primary" onClick={() => navigate(links.organization.index)}>
                        Back to Organizations
                    </Button>
                }
            />
        );
    }

    return <Outlet />;
};
