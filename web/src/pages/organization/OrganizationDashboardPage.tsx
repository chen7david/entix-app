import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Typography, Card, Skeleton, Button, Input, Alert, Descriptions } from "antd";
import { useState } from "react";
import { authClient } from "@web/src/lib/auth-client";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";

const { Title } = Typography;

export const OrganizationDashboardPage = () => {
    const { activeOrganization, loading, userRole } = useOrganization();
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    if (loading) {
        return <Skeleton active />;
    }

    if (!activeOrganization) {
        return <div>Organization not found</div>;
    }

    const handleInvite = async () => {
        setInviteLoading(true);
        setInviteError(null);
        setInviteSuccess(null);
        const { error } = await authClient.organization.inviteMember({
            email: inviteEmail,
            role: "member",
            organizationId: activeOrganization.id
        });

        if (error) {
            setInviteError(error.message || "Failed to invite user");
        } else {
            setInviteSuccess("User invited successfully");
            setInviteEmail("");
        }
        setInviteLoading(false);
    };

    return (
        <>
            <Toolbar />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Title level={2}>Dashboard: {activeOrganization.name}</Title>
                </div>

                <Card title="Organization Details" className="mb-6">
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="ID">{activeOrganization.id}</Descriptions.Item>
                        <Descriptions.Item label="Name">{activeOrganization.name}</Descriptions.Item>
                        <Descriptions.Item label="Slug">{activeOrganization.slug}</Descriptions.Item>
                        <Descriptions.Item label="Role">{userRole || 'Member'}</Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card title="Invite User">
                    {inviteError && <Alert message={inviteError} type="error" showIcon className="mb-4" />}
                    {inviteSuccess && <Alert message={inviteSuccess} type="success" showIcon className="mb-4" />}
                    <div className="flex gap-4">
                        <Input
                            placeholder="User Email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button type="primary" loading={inviteLoading} onClick={handleInvite}>
                            Invite
                        </Button>
                    </div>
                </Card>
            </div>
        </>
    );
};
