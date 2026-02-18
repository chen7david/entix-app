import React from 'react';
import { Typography, Card } from 'antd';
import { UserTable } from '@web/src/components/admin/UserTable';

const { Title, Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <Title level={2} className="!mb-0">Admin Dashboard</Title>
                <Text type="secondary">Manage users and system settings</Text>
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
