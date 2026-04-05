import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    MailOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useInvitations, useOrganization } from "@web/src/features/organization";
import {
    Button,
    Form,
    Input,
    Modal,
    message,
    Popconfirm,
    Select,
    Space,
    Statistic,
    Tag,
    Typography,
    theme,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

const { Text } = Typography;

export const OrganizationInvitationsPage = () => {
    const { token } = theme.useToken();
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

    // Pagination logic removed for now as per architectural alignment.
    // API cursor support to be added in a future context.
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
        <div className="flex flex-col h-full">
            <PageHeader
                title="Invitations"
                subtitle="Manage pending and sent invitations to join your organization."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Invite Member
                    </Button>
                }
            />

            {/* Stats Bar - Lean Design */}
            <div className="flex items-center gap-10 px-1" style={{ marginBottom: 20 }}>
                <Statistic
                    title={
                        <Text
                            type="secondary"
                            className="text-[10px] uppercase font-bold tracking-wider"
                        >
                            Total Invitations
                        </Text>
                    }
                    value={totalInvitations}
                    prefix={<MailOutlined className="text-sm opacity-40 mr-1" />}
                    valueStyle={{ fontSize: 16, fontWeight: 700, color: token.colorText }}
                />
                <Statistic
                    title={
                        <Text
                            type="secondary"
                            className="text-[10px] uppercase font-bold tracking-wider"
                        >
                            Pending
                        </Text>
                    }
                    value={pendingCount}
                    prefix={<ClockCircleOutlined className="text-sm opacity-40 mr-1" />}
                    valueStyle={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: pendingCount > 0 ? "#fa8c16" : token.colorText,
                    }}
                />
                <Statistic
                    title={
                        <Text
                            type="secondary"
                            className="text-[10px] uppercase font-bold tracking-wider"
                        >
                            Accepted
                        </Text>
                    }
                    value={acceptedCount}
                    prefix={<CheckCircleOutlined className="text-sm opacity-40 mr-1" />}
                    valueStyle={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: acceptedCount > 0 ? "#52c41a" : token.colorText,
                    }}
                />
            </div>

            <div className="flex-1 min-h-0">
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
                        pagination: null, // TODO: Implement cursor pagination once API supports it.
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
