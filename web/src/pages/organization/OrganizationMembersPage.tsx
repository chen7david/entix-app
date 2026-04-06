import {
    CrownOutlined,
    DeleteOutlined,
    LockOutlined,
    MailOutlined,
    MoreOutlined,
    PlusOutlined,
    SafetyOutlined,
    TeamOutlined,
    UserOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { getAvatarUrl, type MemberDTO } from "@shared";
import { createMemberSchema } from "@shared/schemas/dto/member.dto";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useAuth } from "@web/src/features/auth";
import { MemberAccountAdminPanel } from "@web/src/features/finance/components/MemberAccountAdminPanel";
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
import { useInitializeWallet } from "@web/src/features/wallet/hooks/useInitializeWallet";
import { requestPasswordReset, sendVerificationEmail } from "@web/src/lib/auth-client";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { DateUtils } from "@web/src/utils/date";
import type { MenuProps } from "antd";
import {
    App,
    Avatar,
    Button,
    Drawer,
    Dropdown,
    Form,
    Input,
    Modal,
    Select,
    Skeleton,
    Space,
    Tabs,
    Tag,
    Tooltip,
    Typography,
    theme,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { createSchemaFieldRule } from "antd-zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

const { Title, Text } = Typography;

export const OrganizationMembersPage: React.FC = () => {
    const { token } = theme.useToken();
    const { notification } = App.useApp();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Bind search state generically to url string matching native architecture persistence
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchText, setSearchText] = useState(searchParams.get("q") || "");

    // Defer pushing expensive re-renders and network bounds rapidly on keystroke loops
    const [debouncedSearch] = useDebouncedValue(
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
    const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [limit, setLimit] = useState(10);

    const [createForm] = Form.useForm();
    const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);
    const { activeOrganization } = useOrganization();
    const { metrics, isLoadingMetrics: loadingMetrics } = useBulkMembers(activeOrganization?.id);

    const {
        members,
        loadingMembers: loading,
        updateMemberRoles,
        removeMember,
        checkPermission,
        userRoles: currentUserRoles,
        nextCursor,
        hasNextPage,
    } = useMembers(debouncedSearch, {
        cursor: currentCursor,
        limit: limit,
    });

    const handleNext = useCallback(() => {
        if (nextCursor) {
            setCursorStack((prev) => [...prev, currentCursor || ""]);
            setCurrentCursor(nextCursor);
        }
    }, [nextCursor, currentCursor]);

    const handlePrev = useCallback(() => {
        if (cursorStack.length > 0) {
            const newStack = [...cursorStack];
            const prev = newStack.pop();
            setCursorStack(newStack);
            setCurrentCursor(prev || undefined);
        }
    }, [cursorStack]);

    const { user } = useAuth();
    const currentUserId = user?.id;

    const createMemberMutation = useCreateMember(activeOrganization?.id || "");
    const removeAvatarMutation = useRemoveAvatar(activeOrganization?.id);
    const { mutate: initializeWallet, isPending: isInitializing } = useInitializeWallet(
        activeOrganization?.id || ""
    );

    const handleCreateMember = async (values: any) => {
        try {
            await createMemberMutation.mutateAsync(values);
            setIsCreateModalOpen(false);
            createForm.resetFields();
        } catch {
            // Error handling is done in the hook
        }
    };

    const handleRemoveAvatar = useCallback(
        async (memberUserId: string) => {
            try {
                await removeAvatarMutation.mutateAsync(memberUserId);
                notification.success({
                    message: "Avatar Removed",
                    description: "Profile picture removed successfully",
                });
            } catch {
                notification.error({
                    message: "Removal Failed",
                    description: "Failed to remove profile picture",
                });
            }
        },
        [removeAvatarMutation, notification]
    );

    // Permissions check using better-auth client helper
    const canUpdateMember = checkPermission({ permissions: { member: ["update"] } });
    const canDeleteMember = checkPermission({ permissions: { member: ["delete"] } });

    const handleRoleChange = async (memberId: string, newRoles: string[]) => {
        try {
            await updateMemberRoles(memberId, newRoles);
            notification.success({
                message: "Roles Updated",
                description: "Roles updated successfully",
            });
        } catch {
            notification.error({
                message: "Update Failed",
                description: "Failed to update roles",
            });
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await removeMember(memberId);
            notification.success({
                message: "Member Removed",
                description: "Member removed successfully",
            });
        } catch {
            notification.error({
                message: "Removal Failed",
                description: "Failed to remove member",
            });
        }
    };

    const handleResendPassword = useCallback(
        async (email: string) => {
            if (!email) return;
            const { error } = await requestPasswordReset({
                email,
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) {
                notification.error({
                    message: "Reset Failed",
                    description: error.message,
                });
            } else {
                notification.success({
                    message: "Email Sent",
                    description: "Password reset email sent",
                });
            }
        },
        [notification]
    );

    const handleResendVerification = useCallback(
        async (email: string) => {
            if (!email) return;
            const { error } = await sendVerificationEmail({
                email,
                callbackURL: window.location.origin,
            });
            if (error) {
                notification.error({
                    message: "Email Failed",
                    description: error.message,
                });
            } else {
                notification.success({
                    message: "Email Sent",
                    description: "Verification email sent",
                });
            }
        },
        [notification]
    );

    // Compute role counts from organization-wide metrics if available
    const totalMembers = metrics?.totalMembers ?? metrics?.totalMembers ?? 0;
    const adminCount = metrics?.adminCount ?? 0;
    const ownerCount = metrics?.ownerCount ?? 0;

    const columns: ColumnsType<MemberDTO> = useMemo(
        () => [
            {
                title: "User",
                key: "user",
                width: 250,
                render: (_: any, record: MemberDTO) => (
                    <div className="flex items-center gap-3 p-1">
                        <Avatar
                            src={
                                record.avatarUrl ? getAvatarUrl(record.avatarUrl, "sm") : undefined
                            }
                            icon={<UserOutlined />}
                        />
                        <div className="flex flex-col overflow-hidden">
                            <Typography.Text
                                strong
                                style={{ color: token.colorPrimary }}
                                className="truncate"
                            >
                                {record.name}
                            </Typography.Text>
                            <Typography.Text type="secondary" className="text-xs truncate">
                                {record.email}
                            </Typography.Text>
                        </div>
                    </div>
                ),
            },
            {
                title: "Role",
                dataIndex: "role",
                key: "role",
                width: 200,
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
                                        r === "owner"
                                            ? "purple"
                                            : r === "admin"
                                              ? token.colorPrimary
                                              : "default"
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
                width: 150,
                render: (date: string) => {
                    return (
                        <Tooltip title={DateUtils.toDate(date).toLocaleString()}>
                            {DateUtils.fromNow(date)}
                        </Tooltip>
                    );
                },
            },
        ],
        [token.colorPrimary]
    );

    if (loading && members.length === 0 && !currentCursor) {
        return <Skeleton active />;
    }

    if (!activeOrganization) {
        return <div>Organization not found</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Members"
                subtitle="Manage organization members and roles."
                actions={
                    <div className="flex flex-wrap items-center gap-4">
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
                            className="min-h-[40px]"
                        >
                            Create New Member
                        </Button>
                    </div>
                }
            />

            {/* Stats Cards */}
            <SummaryCardsRow
                loading={loadingMetrics}
                items={[
                    {
                        key: "total",
                        label: "Total Members",
                        value: totalMembers,
                        icon: <TeamOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "admins",
                        label: "Admins",
                        value: adminCount,
                        icon: <SafetyOutlined />,
                        color: "#10b981",
                    },
                    {
                        key: "owners",
                        label: "Owners",
                        value: ownerCount,
                        icon: <CrownOutlined />,
                        color: "#f59e0b",
                    },
                ]}
            />
            <div className="flex-1 min-h-0">
                <DataTableWithFilters<MemberDTO>
                    config={{
                        columns,
                        data: members,
                        loading: loading,
                        rowKey: "userId",
                        selectedRowKey: selectedMember?.userId,
                        onRowClick: (record) => setSelectedMember(record),
                        filters: [
                            {
                                type: "search",
                                key: "q",
                                placeholder: "Search members by name or email...",
                            },
                        ],
                        onFiltersChange: (f: Record<string, any>) => {
                            setSearchText(f.q || "");
                            setCurrentCursor(undefined);
                            setCursorStack([]);
                        },
                        pagination: {
                            hasNextPage,
                            hasPrevPage: cursorStack.length > 0,
                            pageSize: limit,
                            onNext: handleNext,
                            onPrev: handlePrev,
                            onPageSizeChange: (s) => {
                                setLimit(s);
                                setCurrentCursor(undefined);
                                setCursorStack([]);
                            },
                        },
                        actions: (record: MemberDTO) => {
                            const items: MenuProps["items"] = [
                                {
                                    key: "resend-verification",
                                    label: "Resend Verification Email",
                                    icon: <MailOutlined />,
                                    onClick: () => {
                                        if (record.email) handleResendVerification(record.email);
                                    },
                                },
                                {
                                    key: "initialize-wallet",
                                    label: "Initialize Wallet",
                                    icon: <WalletOutlined />,
                                    disabled: isInitializing,
                                    onClick: () => {
                                        initializeWallet(record.userId);
                                    },
                                },
                                {
                                    key: "resend-password",
                                    label: "Resend Password Reset",
                                    icon: <LockOutlined />,
                                    onClick: () => {
                                        if (record.email) handleResendPassword(record.email);
                                    },
                                },
                                {
                                    key: "remove-picture",
                                    label: "Remove Picture",
                                    icon: <DeleteOutlined />,
                                    danger: true,
                                    disabled: !record.avatarUrl,
                                    onClick: () => {
                                        handleRemoveAvatar(record.userId);
                                    },
                                },
                            ];
                            return (
                                <Dropdown menu={{ items }} trigger={["click"]}>
                                    <Button type="text" icon={<MoreOutlined />} />
                                </Dropdown>
                            );
                        },
                    }}
                />
            </div>

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
                        rules={[createSchemaFieldRule(createMemberSchema.pick({ name: true }))]}
                    >
                        <Input placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[createSchemaFieldRule(createMemberSchema.pick({ email: true }))]}
                    >
                        <Input placeholder="colleague@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[createSchemaFieldRule(createMemberSchema.pick({ role: true }))]}
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
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                push={false}
            >
                {selectedMember &&
                    (() => {
                        const activeMember =
                            members?.find((m: any) => m.id === selectedMember.id) || selectedMember;
                        return (
                            <div className="flex flex-col gap-6 pt-2 pb-6">
                                <div className="text-center mb-6">
                                    {activeOrganization ? (
                                        <AvatarDropzone
                                            organizationId={activeOrganization.id}
                                            userId={activeMember.userId}
                                            currentImageUrl={getAvatarUrl(
                                                activeMember.avatarUrl || null,
                                                "xl"
                                            )}
                                            size={96}
                                            className="mx-auto"
                                        />
                                    ) : (
                                        <Avatar
                                            size={96}
                                            icon={<UserOutlined />}
                                            src={getAvatarUrl(activeMember.avatarUrl || null, "xl")}
                                            className="mx-auto"
                                        />
                                    )}
                                    <Title
                                        level={4}
                                        style={{ marginTop: "16px", marginBottom: "4px" }}
                                    >
                                        {activeMember.name}
                                    </Title>
                                    <Text type="secondary">{activeMember.email}</Text>
                                    <div className="mt-2">
                                        <Tag
                                            color={
                                                activeMember.emailVerified ? "success" : "warning"
                                            }
                                        >
                                            {activeMember.emailVerified ? "Verified" : "Unverified"}
                                        </Tag>
                                    </div>
                                </div>

                                <Tabs
                                    defaultActiveKey="1"
                                    className="flex-1"
                                    items={[
                                        {
                                            key: "1",
                                            label: "Personal",
                                            children: (
                                                <UserProfileForm userId={activeMember.userId} />
                                            ),
                                        },
                                        {
                                            key: "2",
                                            label: "Contact",
                                            children: (
                                                <UserContactList userId={activeMember.userId} />
                                            ),
                                        },
                                        {
                                            key: "3",
                                            label: "Wallet",
                                            children: activeOrganization ? (
                                                <MemberAccountAdminPanel
                                                    memberId={activeMember.userId}
                                                    orgId={activeOrganization.id}
                                                    memberName={activeMember.name || "Member"}
                                                />
                                            ) : null,
                                        },
                                        {
                                            key: "4",
                                            label: "Roles",
                                            children: (
                                                <MemberRolesForm
                                                    member={activeMember}
                                                    currentUserId={currentUserId as string}
                                                    canUpdateMember={canUpdateMember}
                                                    canDeleteMember={canDeleteMember}
                                                    handleRoleChange={handleRoleChange}
                                                    handleRemoveMember={handleRemoveMember}
                                                    onRemoveSuccess={() => setSelectedMember(null)}
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
    );
};
