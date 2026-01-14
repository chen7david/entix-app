import React from 'react';
import { List, Button, Card, Typography, Skeleton, Tag, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useListOrganizations, useSetActiveOrganization, useActiveOrganization } from '@web/src/hooks/auth/organization.hook';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const OrganizationListPage: React.FC = () => {
    const { data: organizations, isPending, error } = useListOrganizations();
    const { data: activeOrg } = useActiveOrganization();
    const { mutate: setActive, isPending: isSettingActive } = useSetActiveOrganization();
    const navigate = useNavigate();

    const handleSetActive = (orgId: string) => {
        setActive({ organizationId: orgId }, {
            onSuccess: () => {
                message.success('Active organization updated');
                // Force reload or invalidate queries might be needed if UI doesn't update automatically
                // better-auth hooks usually handle this
                window.location.reload(); // Simple way to ensure all context is refreshed
            },
            onError: (error) => {
                message.error(error.message);
            }
        });
    };

    if (error) {
        return <div className="p-4 text-red-500">Error loading organizations: {error.message}</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} className="!mb-0">Organizations</Title>
                    <Text type="secondary">Manage your organizations and switch between them.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(links.dashboard.createOrganization)}
                >
                    New Organization
                </Button>
            </div>

            <Card className="shadow-sm">
                {isPending ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={organizations || undefined}
                        renderItem={(org) => {
                            const isActive = activeOrg?.id === org.id;
                            return (
                                <List.Item
                                    actions={[
                                        isActive ? (
                                            <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
                                        ) : (
                                            <Button
                                                type="link"
                                                onClick={() => handleSetActive(org.id)}
                                                disabled={isSettingActive}
                                            >
                                                Switch
                                            </Button>
                                        )
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<span className="font-medium">{org.name}</span>}
                                        description={`Slug: ${org.slug}`}
                                        avatar={
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 uppercase">
                                                {org.name.charAt(0)}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Card>
        </div>
    );
};
