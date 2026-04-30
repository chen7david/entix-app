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
import { getAvatarUrl, getRoleColor, type MemberDTO, ORG_ROLE_OPTIONS } from "@shared";
import { createMemberSchema } from "@shared/schemas/dto/member.dto";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useAuth } from "@web/src/features/auth";
import { MemberAccountAdminPanel } from "@web/src/features/finance/components/MemberAccountAdminPanel";
import { MemberBillingSection } from "@web/src/features/finance/components/MemberBillingSection";
import { useBillingPlans } from "@web/src/features/finance/hooks/useBillingPlans";
import { AvatarUpload } from "@web/src/features/media";
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

export const OrganizationMembersPage: React.FC<{ canManage?: boolean }> = ({
    canManage: propCanManage,
}) => {
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
    const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

    const [createForm] = Form.useForm();
    // Store only the ID — the drawer derives live data from the members cache
    // so it re-renders automatically after any query invalidation.
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
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

    const { user, isAdminOrOwner } = useAuth();
    const currentUserId = user?.id;
    const canManage = propCanManage ?? isAdminOrOwner;

    const createMemberMutation = useCreateMember(activeOrganization?.id || "");
    const { data: billingPlansData } = useBillingPlans(activeOrganization?.id || "", {
        limit: 100,
    });
    const activeBillingPlans = (billingPlansData?.data ?? []).filter((plan) => plan.isActive);
    const hasActiveBillingPlans = activeBillingPlans.length > 0;
    const removeAvatarMutation = useRemoveAvatar();
    const { mutate: initializeWallet, isPending: isInitializing } = useInitializeWallet(
        activeOrganization?.id || ""
    );

    const handleCreateMember = async (values: any) => {
        try {
            const roleValue = String(values.role || "").toLowerCase();
            const payload = {
                ...values,
                defaultBillingPlanId: roleValue.includes("student")
                    ? values.defaultBillingPlanId
                    : undefined,
            };
            await createMemberMutation.mutateAsync(payload);
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
                            {memberRoles.map((r) => {
                                return (
                                    <Tag key={r} color={getRoleColor(r)}>
                                        {r.toUpperCase()}
                                    </Tag>
                                );
                            })}
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
                        {canManage && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsCreateModalOpen(true)}
                                size="large"
                                className="h-11 font-semibold transition-all duration-200"
                                disabled={!hasActiveBillingPlans}
                            >
                                Create New Member
                            </Button>
                        )}
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
                        selectedRowKey: selectedMemberId ?? undefined,
                        onRowClick: (record) => setSelectedMemberId(record.userId),
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
                            if (!canManage) return null;

                            return (
                                <Dropdown menu={{ items }} trigger={["click"]}>
                                    <Button
                                        type="text"
                                        icon={<MoreOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                    />
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
                    initialValues={{ role: "student" }}
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
                        <Select options={ORG_ROLE_OPTIONS} />
                    </Form.Item>

                    <Form.Item shouldUpdate={(prev, next) => prev.role !== next.role} noStyle>
                        {({ getFieldValue }) => {
                            const roleValue = String(getFieldValue("role") || "").toLowerCase();
                            const requiresBillingPlan = roleValue.includes("student");
                            if (!requiresBillingPlan) {
                                return null;
                            }
                            return (
                                <Form.Item
                                    name="defaultBillingPlanId"
                                    label="Default Billing Plan"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Billing plan is required when creating students",
                                        },
                                    ]}
                                    extra={
                                        hasActiveBillingPlans
                                            ? undefined
                                            : "Create an active billing plan before creating students."
                                    }
                                >
                                    <Select
                                        placeholder="Select billing plan"
                                        options={activeBillingPlans.map((plan) => ({
                                            value: plan.id,
                                            label: `${plan.name} (${plan.currencyId})`,
                                        }))}
                                        disabled={!hasActiveBillingPlans}
                                    />
                                </Form.Item>
                            );
                        }}
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
                onClose={() => setSelectedMemberId(null)}
                open={!!selectedMemberId}
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                push={false}
            >
                {selectedMemberId &&
                    (() => {
                        // Derive from live cache — re-renders automatically after mutations.
                        const activeMember = members?.find(
                            (m: MemberDTO) => m.userId === selectedMemberId
                        );
                        if (!activeMember) return null;
                        return (
                            <div className="flex flex-col gap-6 pt-2 pb-6">
                                <div className="text-center mb-6">
                                    {activeOrganization ? (
                                        <AvatarUpload
                                            organizationId={activeOrganization.id}
                                            userId={activeMember.userId}
                                            currentImageUrl={getAvatarUrl(
                                                activeMember.avatarUrl || null,
                                                "xl"
                                            )}
                                            size={100}
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
                                                    onRemoveSuccess={() =>
                                                        setSelectedMemberId(null)
                                                    }
                                                />
                                            ),
                                        },
                                        {
                                            key: "5",
                                            label: "Billing",
                                            children: activeOrganization ? (
                                                <MemberBillingSection
                                                    orgId={activeOrganization.id}
                                                    userId={activeMember.userId}
                                                />
                                            ) : null,
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
