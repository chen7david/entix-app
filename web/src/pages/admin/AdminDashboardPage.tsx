import React from 'react';
import { Typography, Statistic, Row, Col, Card, Tag } from 'antd';
import { UserTable } from '@web/src/components/admin/UserTable';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@web/src/lib/auth-client';
import { TeamOutlined, SafetyOutlined, StopOutlined } from '@ant-design/icons';
import { useAuth } from '@web/src/hooks/auth/auth.hook';

const { Title, Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
    const { session } = useAuth();

    const { data: users } = useQuery({
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
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>Admin Dashboard</Title>
                        <Text type="secondary">Manage all system users</Text>
                    </div>
                    <Tag color="purple" className="text-sm px-3 py-1">
                        Logged in as: {session.data?.user?.name}
                    </Tag>
                </div>

                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Total Users"
                                value={totalUsers}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Admins"
                                value={adminUsers}
                                prefix={<SafetyOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Banned"
                                value={bannedUsers}
                                prefix={<StopOutlined />}
                                valueStyle={bannedUsers > 0 ? { color: '#ff4d4f' } : undefined}
                            />
                        </Card>
                    </Col>
                </Row>

                <UserTable />
            </div>
        </>
    );
};
