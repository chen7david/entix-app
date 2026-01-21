import React from 'react';
import { Typography, Card, Button } from 'antd';
import { UserTable } from '@web/src/components/admin/UserTable';
import { links } from '@web/src/constants/links';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Title level={2} className="!mb-0">Admin Dashboard</Title>
                    <Text type="secondary">Manage users and system settings</Text>
                </div>
                <Button icon={<ArrowLeftOutlined />} href={links.dashboard.index}>
                    Back to App
                </Button>
            </div>

            <Card className="shadow-sm">
                <div className="mb-4">
                    <Title level={4}>Users</Title>
                </div>
                <UserTable />
            </Card>
        </div>
    );
};
