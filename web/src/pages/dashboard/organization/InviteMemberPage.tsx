import React from 'react';
import { Card, Typography } from 'antd';
import { InviteMemberForm } from '@web/src/components/organization/InviteMemberForm';
import { InvitationList } from '@web/src/components/organization/InvitationList';

const { Title, Text } = Typography;

export const InviteMemberPage: React.FC = () => {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <Title level={2} className="!mb-0">Invite Members</Title>
                <Text type="secondary">Invite colleagues to join your organization.</Text>
            </div>

            <Card className="shadow-sm mb-6">
                <InviteMemberForm />
            </Card>

            <div className="mb-4">
                <Title level={4}>Pending Invitations</Title>
            </div>
            <Card className="shadow-sm">
                <InvitationList />
            </Card>
        </div>
    );
};
