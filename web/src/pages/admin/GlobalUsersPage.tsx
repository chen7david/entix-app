import React from 'react';
import { Typography, Card, Statistic, Row, Col, Button, Table, message, Dropdown, type MenuProps } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authClient } from '@web/src/lib/auth-client';
import { TeamOutlined, SafetyOutlined, StopOutlined, MoreOutlined, LoginOutlined } from '@ant-design/icons';

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

    const { mutateAsync: impersonateUser, isPending: isImpersonating } = useMutation({
        mutationFn: async (userId: string) => {
            const res = await authClient.admin.impersonateUser({
                userId,
            });
            if (res.error) throw res.error;
            return res.data;
        },
        onSuccess: () => {
            message.success('Successfully impersonating user');
            // Navigate to root to refresh the app state and let GuestGuard compute the user's org routing
            window.location.href = '/';
        },
        onError: (err: any) => {
            message.error(err.message || 'Failed to impersonate user');
        }
    });

    const totalUsers = users?.length || 0;
    const adminUsers = users?.filter((u: any) => u.role === 'admin').length || 0;
    const bannedUsers = users?.filter((u: any) => u.banned).length || 0;

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Text type={role === 'admin' ? 'warning' : 'secondary'}>
                    {role || 'user'}
                </Text>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            render: (_: any, record: any) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'impersonate',
                        label: 'Impersonate User',
                        icon: <LoginOutlined />,
                        onClick: () => impersonateUser(record.id),
                        disabled: isImpersonating
                    }
                ];

                return (
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            }
        }
    ];

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

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 20 }}
                />
            </div>
        </div>
    );
};
