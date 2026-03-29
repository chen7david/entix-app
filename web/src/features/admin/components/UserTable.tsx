import {
    CheckCircleOutlined,
    CrownOutlined,
    LockOutlined,
    MailOutlined,
    MoreOutlined,
    SearchOutlined,
    StopOutlined,
    UserOutlined,
    UserSwitchOutlined,
} from "@ant-design/icons";
import { getAvatarUrl } from "@shared/utils/image-url";
import {
    useAdminUsers,
    useBanUser,
    useImpersonateUser,
    useSetUserRole,
    useUnbanUser,
} from "@web/src/features/admin";
import { UserContactList, UserProfileForm } from "@web/src/features/user-profiles";
import { requestPasswordReset, sendVerificationEmail } from "@web/src/lib/auth-client";
import type { MenuProps } from "antd";
import {
    App,
    Avatar,
    Button,
    Card,
    Drawer,
    Dropdown,
    Input,
    Modal,
    Select,
    Table,
    Tabs,
    Tag,
    Typography,
} from "antd";
import dayjs from "dayjs";
import type React from "react";
import { useState } from "react";

export const UserTable: React.FC = () => {
    const { message } = App.useApp();
    const [searchText, setSearchText] = useState("");
    const { data: users, isPending } = useAdminUsers();
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const { mutate: impersonate } = useImpersonateUser();
    const { mutate: banUser } = useBanUser();
    const { mutate: unbanUser } = useUnbanUser();
    const { mutate: setRole } = useSetUserRole();

    const handleImpersonate = (userId: string) => {
        impersonate(userId, {
            onSuccess: () => message.success("Impersonation started"),
            onError: (error) => message.error(error.message),
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
                        onSuccess: () => message.success("User banned"),
                        onError: (error) => message.error(error.message),
                    }
                );
            },
        });
    };

    const handleUnbanUser = (userId: string) => {
        unbanUser(userId, {
            onSuccess: () => message.success("User unbanned"),
            onError: (error) => message.error(error.message),
        });
    };

    const handleSetRole = (userId: string, role: string) => {
        setRole(
            { userId, role: role as "user" | "admin" },
            {
                onSuccess: () => message.success("Role updated"),
                onError: (error) => message.error(error.message),
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

    const columns = [
        {
            title: "User",
            key: "user",
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
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: any) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
                record.email.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role: string) => (
                <Tag color={role === "admin" ? "gold" : "blue"}>{role.toUpperCase()}</Tag>
            ),
        },
        {
            title: "Status",
            key: "status",
            render: (_: any, record: any) =>
                record.banned ? <Tag color="error">BANNED</Tag> : <Tag color="success">ACTIVE</Tag>,
        },
        {
            title: "Joined",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => dayjs(date).format("MMM D, YYYY"),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => {
                const items: MenuProps["items"] = [
                    {
                        key: "impersonate",
                        label: "Impersonate",
                        icon: <UserSwitchOutlined />,
                        onClick: () => handleImpersonate(record.id),
                    },
                    {
                        key: "role",
                        label: record.role === "admin" ? "Demote to User" : "Promote to Admin",
                        icon: record.role === "admin" ? <UserOutlined /> : <CrownOutlined />,
                        onClick: () =>
                            handleSetRole(record.id, record.role === "admin" ? "user" : "admin"),
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
                            record.banned ? handleUnbanUser(record.id) : handleBanUser(record.id),
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
        },
    ];

    return (
        <div className="space-y-4">
            <Input
                placeholder="Search users..."
                prefix={<SearchOutlined />}
                className="max-w-xs"
                onChange={(e) => setSearchText(e.target.value)}
            />
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={isPending}
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({
                    onClick: () => setSelectedUser(record),
                    className:
                        "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                })}
            />

            <Drawer
                title={`${selectedUser?.name || "User"} Details`}
                placement="right"
                onClose={() => setSelectedUser(null)}
                open={!!selectedUser}
                width={400}
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
