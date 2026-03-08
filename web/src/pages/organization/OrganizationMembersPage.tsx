import { useMembers } from "@web/src/hooks/auth/useMembers";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Table, Typography, Avatar, Tag, Skeleton, Select, Button, message, Tooltip, Space, Modal, Form, Input, Statistic, Row, Col, Card, Dropdown, type MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { UserOutlined, DeleteOutlined, PlusOutlined, TeamOutlined, SafetyOutlined, CrownOutlined, SearchOutlined, MoreOutlined, MailOutlined, KeyOutlined, CameraOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useAuth } from "@web/src/hooks/auth/useAuth";
import { requestPasswordReset, sendVerificationEmail } from "@web/src/lib/auth-client";
import { useCreateMember } from "@web/src/hooks/organization/useCreateMember";
import { useRemoveAvatar } from "@web/src/hooks/organization/useUpdateAvatar";
import { AvatarUploader } from "@web/src/components/Upload/AvatarUploader";
import { useState } from "react";
import { getAvatarUrl } from "@shared/utils/image-url";

const { Title, Text } = Typography;

export const OrganizationMembersPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [createForm] = Form.useForm();
    // Avatar upload state: tracks which member's avatar is being updated
    const [avatarTarget, setAvatarTarget] = useState<{ userId: string } | null>(null);
    const { activeOrganization } = useOrganization();

    const {
        members,
        loadingMembers: loading,
        updateMemberRoles,
        removeMember,
        checkPermission,
        userRoles: currentUserRoles,
    } = useMembers();

    const { session } = useAuth();
    const currentUserId = session.data?.user?.id;

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

    // Permissions check using better-auth client helper
    const canUpdateMember = checkPermission({ permissions: { member: ["update"] } });
    const canDeleteMember = checkPermission({ permissions: { member: ["delete"] } });

    const handleRoleChange = async (memberId: string, newRoles: string[]) => {
        try {
            await updateMemberRoles(memberId, newRoles);
            message.success('Roles updated successfully');
        } catch {
            message.error('Failed to update roles');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await removeMember(memberId);
            message.success('Member removed successfully');
        } catch {
            message.error('Failed to remove member');
        }
    };

    const handleResendPassword = async (email: string) => {
        if (!email) return;
        const { error } = await requestPasswordReset({ email, redirectTo: window.location.origin + '/auth/reset-password' });
        if (error) {
            message.error('Failed to send password reset: ' + error.message);
        } else {
            message.success('Password reset email sent');
        }
    };

    const handleResendVerification = async (email: string) => {
        if (!email) return;
        const { error } = await sendVerificationEmail({ email, callbackURL: window.location.origin });
        if (error) {
            message.error('Failed to send verification email: ' + error.message);
        } else {
            message.success('Verification email sent');
        }
    };

    // Compute role counts
    const totalMembers = members?.length || 0;
    const adminCount = members?.filter((m: Record<string, unknown>) => (String(m.role || '')).includes('admin')).length || 0;
    const ownerCount = members?.filter((m: Record<string, unknown>) => (String(m.role || '')).includes('owner')).length || 0;

    const columns: ColumnsType<Record<string, unknown>> = [
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
            render: (user: Record<string, unknown>) => (
                <div className="flex items-center gap-2">
                    <Avatar src={getAvatarUrl(user.image as string | undefined, 'sm')} icon={<UserOutlined />} />
                    <div className="flex flex-col">
                        <span>{user.name as string}</span>
                        <span className="text-xs text-gray-500">{user.email as string}</span>
                    </div>
                </div>
            ),
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value, record) => {
                const user = record.user as Record<string, string> | undefined;
                const v = String(value).toLowerCase();
                return (user?.name?.toLowerCase().includes(v) || user?.email?.toLowerCase().includes(v)) ?? false;
            },
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role, record) => {
                const isSelf = record.userId === currentUserId;
                const memberRoles = (String(role || "")).split(",").map(r => r.trim()).filter(Boolean);

                const canEdit = canUpdateMember && !isSelf;

                if (!canEdit) {
                    return (
                        <Tooltip title={isSelf ? "You cannot change your own role here" : "You do not have permission to change this role"}>
                            <Space wrap>
                                {memberRoles.map(r => (
                                    <Tag key={r} color={r === 'owner' ? 'gold' : r === 'admin' ? 'blue' : 'default'} style={{ cursor: 'not-allowed' }}>
                                        {r.toUpperCase()}
                                    </Tag>
                                ))}
                            </Space>
                        </Tooltip>
                    );
                }

                return (
                    <Select
                        mode="multiple"
                        defaultValue={memberRoles}
                        style={{ width: 180 }}
                        onChange={(values) => handleRoleChange(record.id as string, values)}
                        options={[
                            { value: 'member', label: 'Member' },
                            { value: 'admin', label: 'Admin' },
                            { value: 'owner', label: 'Owner' },
                        ]}
                    />
                );
            },
        },
        {
            title: 'Joined At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
    ];

    columns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: Record<string, unknown>) => {
            const isSelf = record.userId === currentUserId;
            const canRemove = canDeleteMember && !isSelf;
            const user = record.user as Record<string, unknown> | undefined;
            const email = (user?.email as string) || '';

            const hasAvatar = !!(user?.image);

            const items: MenuProps['items'] = [
                {
                    key: 'avatar',
                    label: 'Update Profile Picture',
                    icon: <CameraOutlined />,
                    onClick: () => setAvatarTarget({ userId: record.userId as string }),
                },
                ...(hasAvatar ? [{
                    key: 'removeAvatar',
                    label: 'Remove Profile Picture',
                    icon: <CloseCircleOutlined />,
                    onClick: () => {
                        Modal.confirm({
                            title: 'Remove Profile Picture',
                            content: `Remove ${user?.name || 'this member'}'s profile picture?`,
                            okText: 'Yes, Remove',
                            okType: 'danger' as const,
                            cancelText: 'Cancel',
                            onOk: async () => {
                                try {
                                    await removeAvatarMutation.mutateAsync(record.userId as string);
                                } catch {
                                    // error handled in hook
                                }
                            },
                        });
                    },
                }] : []),
                {
                    type: 'divider' as const,
                },
                {
                    key: 'verify',
                    label: 'Resend Verification Email',
                    icon: <MailOutlined />,
                    onClick: () => handleResendVerification(email),
                },
                {
                    key: 'password',
                    label: 'Resend Password Reset',
                    icon: <KeyOutlined />,
                    onClick: () => handleResendPassword(email),
                },
                {
                    type: 'divider' as const,
                },
                {
                    key: 'remove',
                    label: 'Remove Member',
                    icon: <DeleteOutlined />,
                    danger: true,
                    disabled: !canRemove,
                    onClick: () => {
                        Modal.confirm({
                            title: 'Remove Member',
                            content: `Are you sure you want to remove ${user?.name || 'this member'}?`,
                            okText: 'Yes, Remove',
                            okType: 'danger',
                            cancelText: 'Cancel',
                            onOk: () => handleRemoveMember(record.id as string),
                        });
                    }
                }
            ];

            return (
                <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            );
        }
    });

    if (loading) {
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
                        <Title level={2} style={{ marginBottom: 4 }}>Members</Title>
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
                        <Card>
                            <Statistic
                                title="Total Members"
                                value={totalMembers}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Admins"
                                value={adminCount}
                                prefix={<SafetyOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Owners"
                                value={ownerCount}
                                prefix={<CrownOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search members..."
                        prefix={<SearchOutlined />}
                        className="max-w-xs"
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                </div>

                <Table
                    dataSource={members}
                    columns={columns}
                    rowKey={(record: any) => record.id || record.userId}
                    pagination={{ pageSize: 10 }}
                />


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
                        initialValues={{ role: 'member' }}
                    >
                        <Form.Item
                            name="name"
                            label="Full Name"
                            rules={[
                                { required: true, message: 'Please input the full name!' }
                            ]}
                        >
                            <Input placeholder="John Doe" />
                        </Form.Item>

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
                                <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="primary" htmlType="submit" loading={createMemberMutation.isPending}>
                                    Create Member
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Avatar Uploader Modal */}
                {avatarTarget && activeOrganization && (
                    <AvatarUploader
                        organizationId={activeOrganization.id}
                        userId={avatarTarget.userId}
                        open={!!avatarTarget}
                        onClose={() => setAvatarTarget(null)}
                    />
                )}
            </div>
        </>
    );
};
