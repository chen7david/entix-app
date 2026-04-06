import {
    CheckCircleOutlined,
    CrownOutlined,
    LockOutlined,
    MailOutlined,
    MoreOutlined,
    StopOutlined,
    UserOutlined,
    UserSwitchOutlined,
} from "@ant-design/icons";
import { getAvatarUrl } from "@shared";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import {
    useAdminUsers,
    useBanUser,
    useImpersonateUser,
    useResendVerification,
    useSetUserRole,
    useUnbanUser,
} from "@web/src/features/admin";
import { UserContactList, UserProfileForm } from "@web/src/features/user-profiles";
import { requestPasswordReset } from "@web/src/lib/auth-client";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import type { MenuProps } from "antd";
import {
    App,
    Avatar,
    Button,
    Card,
    Drawer,
    Dropdown,
    Modal,
    Select,
    Tabs,
    Tag,
    Typography,
} from "antd";
import dayjs from "dayjs";
import type React from "react";
import { useCallback, useState } from "react";

export const UserTable: React.FC = () => {
    const { notification } = App.useApp();
    const [searchText, setSearchText] = useState("");
    const [currentCursor, setCurrentCursor] = useState<string | undefined>();
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [limit, setLimit] = useState(10);

    const [debouncedSearch] = useDebouncedValue(searchText, {
        wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE,
    });

    const { data: userData, isPending: isLoading } = useAdminUsers(debouncedSearch || undefined, {
        cursor: currentCursor,
        limit,
    });

    const [selectedUser, setSelectedUser] = useState<any>(null);

    const { mutate: impersonate } = useImpersonateUser();
    const { mutate: banUser } = useBanUser();
    const { mutate: unbanUser } = useUnbanUser();
    const { mutate: setRole } = useSetUserRole();

    const handleNext = useCallback(() => {
        if (userData?.nextCursor) {
            setCursorStack((prev) => [...prev, currentCursor || ""]);
            setCurrentCursor(userData.nextCursor);
        }
    }, [userData?.nextCursor, currentCursor]);

    const handlePrev = useCallback(() => {
        const prevStack = [...cursorStack];
        const prevCursor = prevStack.pop();
        setCursorStack(prevStack);
        setCurrentCursor(prevCursor);
    }, [cursorStack]);

    const handleImpersonate = (userId: string) => {
        impersonate(userId, {
            onSuccess: () =>
                notification.success({
                    message: "Impersonation Started",
                    description: "You are now impersonating the user.",
                }),
            onError: (error) =>
                notification.error({
                    message: "Impersonation Failed",
                    description: error.message,
                }),
        });
    };

    const handleBanUser = (userId: string) => {
        Modal.confirm({
            title: "Ban User",
            content: "Are you sure you want to ban this user?",
            onOk: () => {
                banUser(
                    { userId, banReason: "Admin action" },
                    {
                        onSuccess: () =>
                            notification.success({
                                message: "User Banned",
                                description: "The user has been banned successfully.",
                            }),
                        onError: (error) =>
                            notification.error({
                                message: "Ban Failed",
                                description: error.message,
                            }),
                    }
                );
            },
        });
    };

    const handleUnbanUser = (userId: string) => {
        unbanUser(userId, {
            onSuccess: () =>
                notification.success({
                    message: "User Unbanned",
                    description: "The user has been unbanned successfully.",
                }),
            onError: (error) =>
                notification.error({
                    message: "Unban Failed",
                    description: error.message,
                }),
        });
    };

    const handleSetRole = (userId: string, role: string) => {
        setRole(
            { userId, role: role as "user" | "admin" },
            {
                onSuccess: () =>
                    notification.success({
                        message: "Role Updated",
                        description: "The user's role has been updated.",
                    }),
                onError: (error) =>
                    notification.error({
                        message: "Update Failed",
                        description: error.message,
                    }),
            }
        );
    };

    const handleResendPassword = async (email: string) => {
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
    };

    const { mutate: resendVerification } = useResendVerification();

    const handleResendVerification = (email: string) => {
        if (!email) return;
        resendVerification(email, {
            onSuccess: () =>
                notification.success({
                    message: "Email Sent",
                    description: "Verification email sent",
                }),
            onError: (error: Error) =>
                notification.error({
                    message: "Email Failed",
                    description: error.message,
                }),
        });
    };

    const columns = [
        {
            title: "User",
            key: "user",
            width: 250,
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={record.image ? getAvatarUrl(record.image, "sm") : undefined}
                        icon={<UserOutlined />}
                        className="flex-shrink-0"
                    />
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-xs text-gray-500">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            width: 120,
            render: (role: string) => (
                <Tag color={role === "admin" ? "gold" : "blue"}>{role.toUpperCase()}</Tag>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 120,
            render: (_: any, record: any) =>
                record.banned ? <Tag color="error">BANNED</Tag> : <Tag color="success">ACTIVE</Tag>,
        },
        {
            title: "Joined",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            render: (date: number) => dayjs(date).format("MMM D, YYYY"),
        },
    ];

    return (
        <div className="h-[calc(100vh-280px)] min-h-[500px]">
            <DataTableWithFilters
                config={{
                    columns,
                    data: userData?.items || [],
                    loading: isLoading,
                    onRowClick: (record: any) => setSelectedUser(record),
                    filters: [
                        {
                            type: "search",
                            key: "search",
                            placeholder: "Search users...",
                        },
                    ],
                    onFiltersChange: (f: Record<string, any>) => {
                        setSearchText(f.search || "");
                        setCurrentCursor(undefined);
                        setCursorStack([]);
                    },
                    pagination: {
                        pageSize: limit,
                        hasNextPage: !!userData?.nextCursor,
                        hasPrevPage: cursorStack.length > 0,
                        onNext: handleNext,
                        onPrev: handlePrev,
                        onPageSizeChange: (s) => {
                            setLimit(s);
                            setCurrentCursor(undefined);
                            setCursorStack([]);
                        },
                    },
                    actions: (record: any) => {
                        const items: MenuProps["items"] = [
                            {
                                key: "impersonate",
                                label: "Impersonate",
                                icon: <UserSwitchOutlined />,
                                onClick: () => handleImpersonate(record.id),
                            },
                            {
                                key: "role",
                                label:
                                    record.role === "admin" ? "Demote to User" : "Promote to Admin",
                                icon:
                                    record.role === "admin" ? <UserOutlined /> : <CrownOutlined />,
                                onClick: () =>
                                    handleSetRole(
                                        record.id,
                                        record.role === "admin" ? "user" : "admin"
                                    ),
                            },
                            {
                                key: "verify",
                                label: "Resend Verification Email",
                                icon: <MailOutlined />,
                                onClick: () => handleResendVerification(record.email),
                            },
                            {
                                key: "password",
                                label: "Resend Password Reset",
                                icon: <LockOutlined />,
                                onClick: () => handleResendPassword(record.email),
                            },
                            {
                                type: "divider",
                            },
                            {
                                key: "ban",
                                label: record.banned ? "Unban User" : "Ban User",
                                icon: record.banned ? <CheckCircleOutlined /> : <StopOutlined />,
                                danger: !record.banned,
                                onClick: () =>
                                    record.banned
                                        ? handleUnbanUser(record.id)
                                        : handleBanUser(record.id),
                            },
                        ];

                        return (
                            <div onClick={(e) => e.stopPropagation()}>
                                <Dropdown menu={{ items }} trigger={["click"]}>
                                    <Button type="text" icon={<MoreOutlined />} />
                                </Dropdown>
                            </div>
                        );
                    },
                }}
            />

            <Drawer
                title={`${selectedUser?.name || "User"} Details`}
                placement="right"
                onClose={() => setSelectedUser(null)}
                open={!!selectedUser}
                width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
                destroyOnClose
            >
                {selectedUser && (
                    <div className="flex flex-col h-full">
                        <div className="text-center mb-6">
                            {selectedUser.image ? (
                                <img
                                    src={getAvatarUrl(selectedUser.image, "xl")}
                                    alt={selectedUser.name}
                                    className="mx-auto w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <Avatar size={96} icon={<UserOutlined />} className="mx-auto" />
                            )}
                            <Typography.Title
                                level={4}
                                style={{ marginTop: "16px", marginBottom: "4px" }}
                            >
                                {selectedUser.name}
                            </Typography.Title>
                            <Typography.Text type="secondary">{selectedUser.email}</Typography.Text>
                            <div className="mt-2">
                                <Tag color={selectedUser.emailVerified ? "success" : "warning"}>
                                    {selectedUser.emailVerified ? "Verified" : "Unverified"}
                                </Tag>
                            </div>
                        </div>

                        <Tabs defaultActiveKey="1" className="flex-1">
                            <Tabs.TabPane tab="Personal Info" key="1">
                                <UserProfileForm userId={selectedUser.id} />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="Contact Details" key="2">
                                <UserContactList userId={selectedUser.id} />
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="Platform Roles" key="3">
                                <Card
                                    size="small"
                                    title="Global Security Settings"
                                    className="mb-4 shadow-sm border-gray-200 dark:border-gray-800"
                                >
                                    <div className="flex flex-col gap-2">
                                        <Typography.Text type="secondary">
                                            Manage top-level system access
                                        </Typography.Text>
                                        <Select
                                            value={selectedUser.role}
                                            style={{ width: "100%" }}
                                            onChange={(val) => {
                                                handleSetRole(selectedUser.id, val);
                                                setSelectedUser({ ...selectedUser, role: val });
                                            }}
                                            options={[
                                                { value: "user", label: "Platform User" },
                                                { value: "admin", label: "Platform Admin" },
                                            ]}
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <Typography.Text className="block mb-2">
                                            Account Status:{" "}
                                            {selectedUser.banned ? (
                                                <Tag color="error">Banned</Tag>
                                            ) : (
                                                <Tag color="success">Active</Tag>
                                            )}
                                        </Typography.Text>
                                        <Button
                                            danger={!selectedUser.banned}
                                            icon={
                                                selectedUser.banned ? (
                                                    <CheckCircleOutlined />
                                                ) : (
                                                    <StopOutlined />
                                                )
                                            }
                                            onClick={() => {
                                                selectedUser.banned
                                                    ? handleUnbanUser(selectedUser.id)
                                                    : handleBanUser(selectedUser.id);
                                                setSelectedUser({
                                                    ...selectedUser,
                                                    banned: !selectedUser.banned,
                                                });
                                            }}
                                            block
                                        >
                                            {selectedUser.banned
                                                ? "Restore Access"
                                                : "Suspend Account"}
                                        </Button>
                                    </div>
                                </Card>
                            </Tabs.TabPane>
                        </Tabs>
                    </div>
                )}
            </Drawer>
        </div>
    );
};
