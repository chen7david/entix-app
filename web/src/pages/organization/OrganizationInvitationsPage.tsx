import { useState } from "react";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { useInvitations } from "@web/src/hooks/auth/useInvitations";
import { Table, Typography, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Space, Statistic, Row, Col, Card } from "antd";
import { PlusOutlined, DeleteOutlined, MailOutlined, ClockCircleOutlined, CheckCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const OrganizationInvitationsPage = () => {
    const { activeOrganization } = useOrganization();

    const {
        invitations,
        loadingInvitations: loading,
        inviteMember,
        cancelInvitation,
        isInviting,
        isCancelingInvitation
    } = useInvitations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
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

    // Compute stats
    const totalInvitations = invitations?.length || 0;
    const pendingCount = invitations?.filter((i: any) => i.status === 'pending').length || 0;
    const acceptedCount = invitations?.filter((i: any) => i.status === 'accepted').length || 0;

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: any) =>
                record.email?.toLowerCase().includes(value.toLowerCase()),
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
            render: (date: string) => dayjs(date).format('MMM D, YYYY'),
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
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>Invitations</Title>
                        <Text type="secondary">Manage pending and sent invitations</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Invite Member
                    </Button>
                </div>

                {/* Stats Cards */}
                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Total Invitations"
                                value={totalInvitations}
                                prefix={<MailOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Pending"
                                value={pendingCount}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={pendingCount > 0 ? { color: '#fa8c16' } : undefined}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Accepted"
                                value={acceptedCount}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={acceptedCount > 0 ? { color: '#52c41a' } : undefined}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search invitations..."
                        prefix={<SearchOutlined />}
                        className="max-w-xs"
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <Table
                    dataSource={invitations}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
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
