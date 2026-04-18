import { AppRoutes } from "@shared";
import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useSignOut } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization/hooks/useOrganization";
import { Button, Card, Typography } from "antd";
import type React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const { Title, Paragraph } = Typography;

export const NoOrganizationPage: React.FC = () => {
    const { mutate: signOut } = useSignOut();
    const navigate = useNavigate();
    const { organizations, orgsLoaded, orgsFetching } = useOrganization();

    useEffect(() => {
        if (!orgsLoaded || orgsFetching) return; // settled list only (not stale cache mid-refetch)

        if (organizations.length === 1) {
            navigate(`/org/${organizations[0].slug}${AppRoutes.org.dashboard.index}`, {
                replace: true,
            });
        } else if (organizations.length > 1) {
            navigate(AppRoutes.onboarding.selectOrganization, { replace: true });
        }
    }, [organizations, orgsLoaded, orgsFetching, navigate]);

    // Spinner while waiting for confirmed org data
    if (!orgsLoaded || orgsFetching) return <CenteredSpin />;

    const handleSignOut = () => {
        signOut(undefined, {
            onSuccess: () => navigate(AppRoutes.auth.signIn),
        });
    };

    return (
        <Card className="w-full max-w-md text-center shadow-lg">
            <Title level={3}>No Organization Found</Title>
            <Paragraph className="mb-6 text-gray-600">
                You are not a member of any organization. Please contact your site administrator to
                request an invitation.
            </Paragraph>
            <Button type="primary" onClick={handleSignOut} block>
                Sign Out
            </Button>
        </Card>
    );
};
