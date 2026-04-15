import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    MailOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { getRoleColor, ORG_ROLE_OPTIONS } from "@shared";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useInvitations, useOrganization } from "@web/src/features/organization";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Tag } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

export const OrganizationInvitationsPage = () => {
    const { notification } = App.useApp();
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
            notification.success({
                message: "Invitation Sent",
                description: "The invitation has been sent successfully.",
            });
            setIsModalOpen(false);
            form.resetFields();
        } catch (error: any) {
            notification.error({
                message: "Invitation Failed",
                description: error.message || "Failed to send invitation.",
            });
        }
    };

    const handleCancel = async (invitationId: string) => {
        try {
            await cancelInvitation(invitationId);
            notification.success({
                message: "Invitation Canceled",
                description: "The invitation has been canceled successfully.",
            });
        } catch (error: any) {
            notification.error({
                message: "Cancel Failed",
                description: error.message || "Failed to cancel invitation.",
            });
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
            render: (role: string) => {
                return <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>;
            },
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
                        size="large"
                        className="h-11 font-semibold transition-all duration-200"
                    >
                        Invite Member
                    </Button>
                }
            />

            <SummaryCardsRow
                items={[
                    {
                        key: "total",
                        label: "Total Invitations",
                        value: totalInvitations,
                        icon: <MailOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "pending",
                        label: "Pending",
                        value: pendingCount,
                        icon: <ClockCircleOutlined />,
                        color: "#fa8c16",
                    },
                    {
                        key: "accepted",
                        label: "Accepted",
                        value: acceptedCount,
                        icon: <CheckCircleOutlined />,
                        color: "#52c41a",
                    },
                ]}
            />

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
                    initialValues={{ role: "student" }}
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
                        <Select options={ORG_ROLE_OPTIONS} />
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
