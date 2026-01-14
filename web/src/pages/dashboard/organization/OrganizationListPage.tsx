import React from 'react';
import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';
import { OrganizationList } from '@web/src/components/organization/OrganizationList';

const { Title, Text } = Typography;

export const OrganizationListPage: React.FC = () => {
    const navigate = useNavigate();

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
                <OrganizationList />
            </Card>
        </div>
    );
};
