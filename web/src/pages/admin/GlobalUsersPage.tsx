import React, { useState } from 'react';
import { Typography, Card, Statistic, Row, Col, Button, Modal, Form, Input, message } from 'antd';
import { UserTable } from '@web/src/components/admin/UserTable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@web/src/lib/auth-client';
import { TeamOutlined, SafetyOutlined, StopOutlined, PlusOutlined } from '@ant-design/icons';
import { useSignUpWithOrg } from '@web/src/hooks/auth/useAuth';

const { Title, Text } = Typography;

export const GlobalUsersPage: React.FC = () => {
    const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const { mutateAsync: provisionUser, isPending: isProvisioning } = useSignUpWithOrg();

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

    const handleProvisionUser = async (values: any) => {
        try {
            await provisionUser({
                email: values.email,
                name: values.name,
                password: values.password, // This should ideally be randomly generated on the backend if not provided, but we'll supply one for the hook signature
                organizationName: values.organizationName,
            });
            message.success('User and Organization provisioned successfully. They can now log in.');
            setIsProvisionModalOpen(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        } catch (error: any) {
            message.error(error.message || 'Failed to provision user');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} style={{ marginBottom: 4 }}>Global Users</Title>
                    <Text type="secondary">Manage all platform users, roles, and access</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsProvisionModalOpen(true)}>
                    Provision New User
                </Button>
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
                <UserTable />
            </div>

            <Modal
                title="Provision New User & Workspace"
                open={isProvisionModalOpen}
                onCancel={() => setIsProvisionModalOpen(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleProvisionUser}
                >
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please input the full name!' }]}
                    >
                        <Input placeholder="Jane Doe" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please input the email address!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="jane@enterprise.com" />
                    </Form.Item>

                    <Form.Item
                        name="organizationName"
                        label="Tenant Workspace Name"
                        rules={[{ required: true, message: 'Please input the organization name!' }]}
                    >
                        <Input placeholder="Enterprise Corp Ltd." />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Temporary Password"
                        extra="The user should change this upon their first login."
                        rules={[
                            { required: true, message: 'Please input a temporary password!' },
                            { min: 8, message: 'Password must be at least 8 characters long.' }
                        ]}
                    >
                        <Input.Password placeholder="Secure temporary password" />
                    </Form.Item>

                    <Form.Item className="mb-0 flex justify-end">
                        <div className="flex gap-2">
                            <Button onClick={() => setIsProvisionModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={isProvisioning}>
                                Provision User
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
