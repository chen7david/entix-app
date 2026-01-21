import React from 'react';
import { Card, List, Typography, Button, Spin, message } from 'antd';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const SelectOrganizationPage: React.FC = () => {
    const { organizations, setActive, loading } = useOrganization();
    const navigate = useNavigate();

    const handleSelect = async (orgId: string) => {
        await setActive(orgId);
        message.success('Organization selected successfully');
        navigate(links.dashboard.index);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <div className="text-center mb-6">
                    <Title level={3}>Select Organization</Title>
                    <Text type="secondary">Choose an organization to continue</Text>
                </div>

                <List
                    itemLayout="horizontal"
                    dataSource={organizations}
                    renderItem={(org) => (
                        <List.Item
                            actions={[
                                <Button
                                    type="primary"
                                    onClick={() => handleSelect(org.id)}
                                >
                                    Select
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={org.name}
                                description={`Slug: ${org.slug}`}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};
