import React from 'react';
import { Typography, Card, Statistic, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@web/src/lib/auth-client';
import { TeamOutlined, SafetyOutlined, StopOutlined } from '@ant-design/icons';
import { UserTable } from '@web/src/components/admin/UserTable';

const { Title, Text } = Typography;

export const GlobalUsersPage: React.FC = () => {
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const res = await authClient.admin.listUsers({
                query: { limit: 100 },
            });
            if (res.error) throw res.error;
            return res.data.users;
        },
    });

    const totalUsers = users?.length || 0;
    const adminUsers = users?.filter((u: any) => u.role === 'admin').length || 0;
    const bannedUsers = users?.filter((u: any) => u.banned).length || 0;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} style={{ marginBottom: 4 }}>Global Users</Title>
                    <Text type="secondary">Manage all platform users, roles, and access</Text>
                </div>
            </div>

            <Row gutter={16} className="mb-8">
                <Col xs={24} sm={8}>
                    <Card loading={isLoading} className="border-gray-200 shadow-sm">
                        <Statistic
                            title="Total Users"
                            value={totalUsers}
                            prefix={<TeamOutlined className="text-blue-500" />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card loading={isLoading} className="border-gray-200 shadow-sm">
                        <Statistic
                            title="Platform Admins"
                            value={adminUsers}
                            prefix={<SafetyOutlined className="text-yellow-500" />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card loading={isLoading} className="border-gray-200 shadow-sm">
                        <Statistic
                            title="Banned Users"
                            value={bannedUsers}
                            prefix={<StopOutlined className="text-red-500" />}
                            valueStyle={bannedUsers > 0 ? { color: '#ff4d4f' } : undefined}
                        />
                    </Card>
                </Col>
            </Row>

            <UserTable />
        </div>
    );
};
