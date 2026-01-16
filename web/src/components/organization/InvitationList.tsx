import React from 'react';
import { List, Button, Tag, message, Skeleton, Typography } from 'antd';
import { useListInvitations, useCancelInvitation } from '@web/src/hooks/auth/organization.hook';

interface Invitation {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    organizationId: string;
    status: string;
}

const { Text } = Typography;

export const InvitationList: React.FC = () => {
    const { data: invitations, isPending, error } = useListInvitations();
    const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation();

    const handleCancel = (invitationId: string) => {
        cancelInvitation({ invitationId }, {
            onSuccess: () => {
                message.success('Invitation cancelled');
            },
            onError: (error) => {
                message.error(error.message);
            }
        });
    };

    if (error) {
        return <div className="text-red-500">Error loading invitations: {error.message}</div>;
    }

    if (isPending) {
        return <Skeleton active paragraph={{ rows: 2 }} />;
    }

    if (!invitations || invitations.length === 0) {
        return <Text type="secondary">No pending invitations.</Text>;
    }

    return (
        <List
            itemLayout="horizontal"
            dataSource={invitations?.filter(inv => inv.status === 'pending') as Invitation[]}
            renderItem={(invitation: Invitation) => (
                <List.Item
                    actions={[
                        <Button
                            danger
                            type="link"
                            onClick={() => handleCancel(invitation.id)}
                            loading={isCancelling}
                        >
                            Cancel
                        </Button>
                    ]}
                >
                    <List.Item.Meta
                        title={invitation.email}
                        description={
                            <div className="flex gap-2 items-center">
                                <Tag>{invitation.role}</Tag>
                                <Text type="secondary" className="text-xs">
                                    Sent: {new Date(invitation.createdAt).toLocaleDateString()}
                                </Text>
                            </div>
                        }
                    />
                </List.Item>
            )}
        />
    );
};
