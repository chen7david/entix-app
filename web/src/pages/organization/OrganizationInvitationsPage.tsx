import { useState } from "react";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Table, Typography, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";

const { Title } = Typography;

export const OrganizationInvitationsPage = () => {
    const {
        invitations,
        loading,
        activeOrganization,
        inviteMember,
        cancelInvitation,
        isInviting,
        isCancelingInvitation
    } = useOrganization();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const handleInvite = async (values: any) => {
        try {
            await inviteMember(values.email, values.role);
            message.success("Invitation sent successfully");
            setIsModalOpen(false);
            form.resetFields();
        } catch (error: any) {
            message.error(error.message || "Failed to send invitation");
        }
    };

    const handleCancel = async (invitationId: string) => {
        try {
            await cancelInvitation(invitationId);
            message.success("Invitation canceled successfully");
        } catch (error: any) {
            message.error(error.message || "Failed to cancel invitation");
        }
    };

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => <Tag color={role === 'admin' ? 'blue' : 'default'}>{role.toUpperCase()}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'pending' ? 'orange' : status === 'accepted' ? 'green' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Expires At',
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: any) => (
                <Popconfirm
                    title="Cancel Invitation"
                    description="Are you sure you want to cancel this invitation?"
                    onConfirm={() => handleCancel(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        loading={isCancelingInvitation}
                    >
                        Revoke
                    </Button>
                </Popconfirm>
            ),
        }
    ];

    if (!activeOrganization) return null;

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <Title level={2}>Invitations</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Invite Member
                    </Button>
                </div>

                <Table
                    dataSource={invitations}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                />

                <Modal
                    title="Invite Member"
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleInvite}
                        initialValues={{ role: 'member' }}
                    >
                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: 'Please input the email address!' },
                                { type: 'email', message: 'Please enter a valid email!' }
                            ]}
                        >
                            <Input placeholder="colleague@example.com" />
                        </Form.Item>

                        <Form.Item
                            name="role"
                            label="Role"
                            rules={[{ required: true, message: 'Please select a role!' }]}
                        >
                            <Select>
                                <Select.Option value="member">Member</Select.Option>
                                <Select.Option value="admin">Admin</Select.Option>
                                <Select.Option value="owner">Owner</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item className="mb-0 flex justify-end">
                            <Space>
                                <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="primary" htmlType="submit" loading={isInviting}>
                                    Send Invitation
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
};
