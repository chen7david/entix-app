import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    MailOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { useInvitations, useOrganization } from "@web/src/features/organization";
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    Modal,
    message,
    Popconfirm,
    Row,
    Select,
    Space,
    Statistic,
    Tag,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

const { Title, Text } = Typography;

export const OrganizationInvitationsPage = () => {
    const { activeOrganization } = useOrganization();

    const {
        invitations,
        loadingInvitations: loading,
        inviteMember,
        cancelInvitation,
        isInviting,
        isCancelingInvitation,
    } = useInvitations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
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
    const pendingCount = invitations?.filter((i: any) => i.status === "pending").length || 0;
    const acceptedCount = invitations?.filter((i: any) => i.status === "accepted").length || 0;

    const filteredInvitations = useMemo(() => {
        if (!invitations) return [];
        if (!searchText) return invitations;
        const lowerSearch = searchText.toLowerCase();
        return invitations.filter((i: any) => i.email?.toLowerCase().includes(lowerSearch));
    }, [invitations, searchText]);

    const columns = [
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role: string) => (
                <Tag color={role === "admin" ? "blue" : "default"}>{role.toUpperCase()}</Tag>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag
                    color={
                        status === "pending" ? "orange" : status === "accepted" ? "green" : "red"
                    }
                >
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Expires At",
            dataIndex: "expiresAt",
            key: "expiresAt",
            render: (date: string) => dayjs(date).format("MMM D, YYYY"),
        },
    ];

    if (!activeOrganization) return null;

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Invitations
                    </Title>
                    <Text type="secondary">Manage pending and sent invitations</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Invite Member
                </Button>
            </div>

            {/* Stats Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
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
                            valueStyle={pendingCount > 0 ? { color: "#fa8c16" } : undefined}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Accepted"
                            value={acceptedCount}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={acceptedCount > 0 ? { color: "#52c41a" } : undefined}
                        />
                    </Card>
                </Col>
            </Row>

            <div className="h-[calc(100vh-420px)] min-h-[500px]">
                <DataTableWithFilters
                    config={{
                        columns,
                        data: filteredInvitations,
                        loading,
                        filters: [
                            {
                                type: "search",
                                key: "email",
                                placeholder: "Search invitations by email...",
                            },
                        ],
                        onFiltersChange: (f: Record<string, any>) => setSearchText(f.email || ""),
                        pagination: null,
                        actions: (record: any) => (
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
                                    type="text"
                                    loading={isCancelingInvitation}
                                >
                                    Revoke
                                </Button>
                            </Popconfirm>
                        ),
                    }}
                />
            </div>

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
                    initialValues={{ role: "member" }}
                >
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: "Please input the email address!" },
                            { type: "email", message: "Please enter a valid email!" },
                        ]}
                    >
                        <Input placeholder="colleague@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: "Please select a role!" }]}
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
    );
};
