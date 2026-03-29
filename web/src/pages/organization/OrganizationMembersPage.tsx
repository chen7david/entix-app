import {
    CrownOutlined,
    DeleteOutlined,
    LockOutlined,
    MailOutlined,
    MoreOutlined,
    PlusOutlined,
    SafetyOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { getAvatarUrl } from "@shared";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useAuth } from "@web/src/features/auth";
import { AvatarDropzone } from "@web/src/features/media";
import {
    useBulkMembers,
    useCreateMember,
    useMembers,
    useOrganization,
} from "@web/src/features/organization";
import {
    MemberRolesForm,
    UserContactList,
    UserProfileForm,
    useRemoveAvatar,
} from "@web/src/features/user-profiles";
import { requestPasswordReset, sendVerificationEmail } from "@web/src/lib/auth-client";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { DateUtils } from "@web/src/utils/date";
import type { MenuProps } from "antd";
import {
    Avatar,
    Button,
    Card,
    Col,
    Drawer,
    Dropdown,
    Form,
    Input,
    Modal,
    message,
    Row,
    Select,
    Skeleton,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

const { Title, Text } = Typography;

export const OrganizationMembersPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Bind search state generically to url string matching native architecture persistence
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchText, setSearchText] = useState(searchParams.get("q") || "");

    // Defer pushing expensive re-renders and network bounds rapidly on keystroke loops
    const [debouncedSearch, control] = useDebouncedValue(
        searchText,
        { wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE },
        (state) => ({ isPending: state.isPending })
    );

    // Sync to URL safely automatically reliably neatly explicitly
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            newParams.set("q", debouncedSearch);
        } else {
            newParams.delete("q");
        }
        setSearchParams(newParams, { replace: true });
    }, [debouncedSearch, setSearchParams, searchParams]);
    const [createForm] = Form.useForm();
    const [selectedMember, setSelectedMember] = useState<Record<string, unknown> | null>(null);
    const { activeOrganization } = useOrganization();
    const { metrics, isLoadingMetrics: loadingMetrics } = useBulkMembers(activeOrganization?.id);

    const {
        members,
        loadingMembers: loading,
        updateMemberRoles,
        removeMember,
        checkPermission,
        userRoles: currentUserRoles,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMembers(debouncedSearch);

    const { user } = useAuth();
    const currentUserId = user?.id;

    const createMemberMutation = useCreateMember(activeOrganization?.id || "");
    const removeAvatarMutation = useRemoveAvatar(activeOrganization?.id);

    const handleCreateMember = async (values: any) => {
        try {
            await createMemberMutation.mutateAsync(values);
            setIsCreateModalOpen(false);
            createForm.resetFields();
        } catch {
            // Error handling is done in the hook
        }
    };

    const handleRemoveAvatar = async (memberUserId: string) => {
        try {
            await removeAvatarMutation.mutateAsync(memberUserId);
            message.success("Profile picture removed successfully");
        } catch {
            message.error("Failed to remove profile picture");
        }
    };

    // Permissions check using better-auth client helper
    const canUpdateMember = checkPermission({ permissions: { member: ["update"] } });
    const canDeleteMember = checkPermission({ permissions: { member: ["delete"] } });

    const handleRoleChange = async (memberId: string, newRoles: string[]) => {
        try {
            await updateMemberRoles(memberId, newRoles);
            message.success("Roles updated successfully");
        } catch {
            message.error("Failed to update roles");
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await removeMember(memberId);
            message.success("Member removed successfully");
        } catch {
            message.error("Failed to remove member");
        }
    };

    const handleResendPassword = async (email: string) => {
        if (!email) return;
        const { error } = await requestPasswordReset({
            email,
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) {
            message.error(`Failed to send password reset: ${error.message}`);
        } else {
            message.success("Password reset email sent");
        }
    };

    const handleResendVerification = async (email: string) => {
        if (!email) return;
        const { error } = await sendVerificationEmail({
            email,
            callbackURL: window.location.origin,
        });
        if (error) {
            message.error(`Failed to send verification email: ${error.message}`);
        } else {
            message.success("Verification email sent");
        }
    };

    // Compute role counts from organization-wide metrics if available, fallback to list (list is paginated so list-based stats are inaccurate)
    const totalMembers = metrics?.totalMembers ?? members?.length ?? 0;
    const adminCount = metrics?.adminCount ?? 0;
    const ownerCount = metrics?.ownerCount ?? 0;

    const columns: ColumnsType<Record<string, unknown>> = [
        {
            title: "User",
            dataIndex: "user",
            key: "user",
            render: (user: Record<string, unknown>, record: any) => (
                <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded transition-colors"
                    onClick={() => setSelectedMember(record)}
                >
                    <Avatar
                        src={user?.image ? getAvatarUrl(user.image as string, "sm") : undefined}
                        icon={<UserOutlined />}
                    />
                    <div className="flex flex-col">
                        <Typography.Text
                            strong
                            className="text-[#646cff] hover:text-[#747bff] transition-colors"
                        >
                            {user.name as string}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                            {user.email as string}
                        </Typography.Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role: unknown) => {
                const memberRoles = String(role || "")
                    .split(",")
                    .map((r) => r.trim())
                    .filter(Boolean);
                return (
                    <Space wrap>
                        {memberRoles.map((r) => (
                            <Tag
                                key={r}
                                color={
                                    r === "owner" ? "purple" : r === "admin" ? "#646cff" : "default"
                                }
                            >
                                {r.toUpperCase()}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: "Joined At",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => {
                return (
                    <Tooltip title={DateUtils.toDate(date).toLocaleString()}>
                        {DateUtils.fromNow(date)}
                    </Tooltip>
                );
            },
        },
        {
            title: "",
            key: "actions",
            align: "right",
            width: 50,
            render: (_: any, record: any) => {
                const items: MenuProps["items"] = [
                    {
                        key: "resend-verification",
                        label: "Resend Verification Email",
                        icon: <MailOutlined />,
                        onClick: (e) => {
                            e.domEvent.stopPropagation();
                            handleResendVerification(record.user?.email);
                        },
                    },
                    {
                        key: "resend-password",
                        label: "Resend Password Reset",
                        icon: <LockOutlined />,
                        onClick: (e) => {
                            e.domEvent.stopPropagation();
                            handleResendPassword(record.user?.email);
                        },
                    },
                    {
                        key: "remove-picture",
                        label: "Remove Picture",
                        icon: <DeleteOutlined />,
                        danger: true,
                        disabled: !record.user?.image,
                        onClick: (e) => {
                            e.domEvent.stopPropagation();
                            handleRemoveAvatar(record.user?.id as string);
                        },
                    },
                ];
                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
                            <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>
                    </div>
                );
            },
        },
    ];

    if (loading && members.length === 0) {
        return <Skeleton active />;
    }

    if (!activeOrganization) {
        return <div>Organization not found</div>;
    }

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Members
                        </Title>
                        <Text type="secondary">Manage organization members and roles</Text>
                    </div>
                    <div className="flex items-center gap-4">
                        {currentUserRoles && currentUserRoles.length > 0 ? (
                            <Space>
                                {currentUserRoles.map((r: string) => (
                                    <Tag key={r} color="purple" className="text-sm px-3 py-1">
                                        You are: {r.toUpperCase()}
                                    </Tag>
                                ))}
                            </Space>
                        ) : (
                            <Tag color="red" className="text-sm px-3 py-1">
                                Role: Unknown (ID: {currentUserId?.slice(0, 8)})
                            </Tag>
                        )}
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Create New Member
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <Row gutter={16} className="mb-6">
                    <Col xs={24} sm={8}>
                        <Card loading={loadingMetrics}>
                            <Statistic
                                title="Total Members"
                                value={totalMembers}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card loading={loadingMetrics}>
                            <Statistic
                                title="Admins"
                                value={adminCount}
                                prefix={<SafetyOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card loading={loadingMetrics}>
                            <Statistic
                                title="Owners"
                                value={ownerCount}
                                prefix={<CrownOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="mb-4">
                    <Input
                        placeholder="Search members..."
                        prefix={<SearchOutlined />}
                        className="max-w-xs"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        suffix={
                            control.state.isPending ? (
                                <span className="text-xs text-gray-400 italic">typing...</span>
                            ) : null
                        }
                    />
                </div>

                <Table
                    dataSource={members}
                    columns={columns}
                    rowKey={(record: any) => record.id || record.userId}
                    pagination={false}
                    loading={loading && !isFetchingNextPage}
                />

                {hasNextPage && (
                    <div className="flex justify-center mt-6">
                        <Button
                            onClick={() => fetchNextPage()}
                            loading={isFetchingNextPage}
                            type="dashed"
                        >
                            Load More Members
                        </Button>
                    </div>
                )}

                {/* Create New Member Modal */}
                <Modal
                    title="Create New Member"
                    open={isCreateModalOpen}
                    onCancel={() => setIsCreateModalOpen(false)}
                    footer={null}
                >
                    <Form
                        form={createForm}
                        layout="vertical"
                        onFinish={handleCreateMember}
                        initialValues={{ role: "member" }}
                    >
                        <Form.Item
                            name="name"
                            label="Full Name"
                            rules={[{ required: true, message: "Please input the full name!" }]}
                        >
                            <Input placeholder="John Doe" />
                        </Form.Item>

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
                                <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={createMemberMutation.isPending}
                                >
                                    Create Member
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Member Details Drawer */}
                <Drawer
                    title="Member Details"
                    placement="right"
                    onClose={() => setSelectedMember(null)}
                    open={!!selectedMember}
                    width={400}
                    push={false}
                >
                    {selectedMember &&
                        (() => {
                            const activeMember =
                                members?.find((m: any) => m.id === selectedMember.id) ||
                                selectedMember;
                            const user = activeMember.user as Record<string, unknown> | undefined;
                            return (
                                <div className="flex flex-col gap-6 pt-2 pb-6">
                                    <div className="text-center mb-6">
                                        {activeOrganization ? (
                                            <AvatarDropzone
                                                organizationId={activeOrganization.id}
                                                userId={activeMember.userId as string}
                                                currentImageUrl={getAvatarUrl(
                                                    user?.image as string,
                                                    "xl"
                                                )}
                                                size={96}
                                                className="mx-auto"
                                            />
                                        ) : (
                                            <Avatar
                                                size={96}
                                                icon={<UserOutlined />}
                                                src={getAvatarUrl(user?.image as string, "xl")}
                                                className="mx-auto"
                                            />
                                        )}
                                        <Title
                                            level={4}
                                            style={{ marginTop: "16px", marginBottom: "4px" }}
                                        >
                                            {user?.name as string}
                                        </Title>
                                        <Text type="secondary">{user?.email as string}</Text>
                                        <div className="mt-2">
                                            <Tag
                                                color={user?.emailVerified ? "success" : "warning"}
                                            >
                                                {user?.emailVerified ? "Verified" : "Unverified"}
                                            </Tag>
                                        </div>
                                    </div>

                                    <Tabs
                                        defaultActiveKey="1"
                                        className="flex-1"
                                        items={[
                                            {
                                                key: "1",
                                                label: "Personal Info",
                                                children: (
                                                    <UserProfileForm
                                                        userId={activeMember.userId as string}
                                                    />
                                                ),
                                            },
                                            {
                                                key: "2",
                                                label: "Contact Details",
                                                children: (
                                                    <UserContactList
                                                        userId={activeMember.userId as string}
                                                    />
                                                ),
                                            },
                                            {
                                                key: "3",
                                                label: "Roles",
                                                children: (
                                                    <MemberRolesForm
                                                        member={activeMember}
                                                        currentUserId={currentUserId as string}
                                                        canUpdateMember={canUpdateMember}
                                                        canDeleteMember={canDeleteMember}
                                                        handleRoleChange={handleRoleChange}
                                                        handleRemoveMember={handleRemoveMember}
                                                        onRemoveSuccess={() =>
                                                            setSelectedMember(null)
                                                        }
                                                    />
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            );
                        })()}
                </Drawer>
            </div>
        </>
    );
};
