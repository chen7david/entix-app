import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Table, Typography, Avatar, Tag, Skeleton, Select, Button, Popconfirm, message, Tooltip, Space, Modal, Form, Input } from "antd";
import { UserOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useAuth } from "@web/src/hooks/auth/auth.hook";
import { useCreateMember } from "@web/src/hooks/organization/useCreateMember";
import { useState } from "react";

const { Title } = Typography;

export const OrganizationMembersPage = () => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [inviteForm] = Form.useForm();
    const [createForm] = Form.useForm();
    const {
        members,
        loading,
        activeOrganization,
        updateMemberRoles,
        removeMember,
        checkPermission,
        userRoles: currentUserRoles,
        inviteMember,
        isInviting
    } = useOrganization();

    const { session } = useAuth();
    const currentUserId = session.data?.user?.id;

    const createMemberMutation = useCreateMember(activeOrganization?.id || "");

    const handleInvite = async (values: any) => {
        try {
            await inviteMember(values.email, values.role);
            message.success("Invitation sent successfully");
            setIsInviteModalOpen(false);
            inviteForm.resetFields();
        } catch (error: any) {
            message.error(error.message || "Failed to send invitation");
        }
    };

    const handleCreateMember = async (values: any) => {
        try {
            await createMemberMutation.mutateAsync(values);
            setIsCreateModalOpen(false);
            createForm.resetFields();
        } catch (error: any) {
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
        } catch (error) {
            message.error('Failed to update roles');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await removeMember(memberId);
            message.success('Member removed successfully');
        } catch (error) {
            message.error('Failed to remove member');
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
            render: (user: any) => (
                <div className="flex items-center gap-2">
                    <Avatar src={user.image} icon={<UserOutlined />} />
                    <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string, record: any) => {
                const isSelf = record.userId === currentUserId;
                const memberRoles = (role || "").split(",").map(r => r.trim()).filter(Boolean);

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
                        onChange={(values) => handleRoleChange(record.id, values)}
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
        render: (_: any, record: any) => {
            const isSelf = record.userId === currentUserId;
            const canRemove = canDeleteMember && !isSelf;

            return (
                <Popconfirm
                    title="Remove member"
                    description="Are you sure you want to remove this member from the organization?"
                    onConfirm={() => handleRemoveMember(record.id)}
                    okText="Yes"
                    cancelText="No"
                    disabled={!canRemove}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!canRemove}
                        title={!canRemove ? "Cannot remove this member" : "Remove member"}
                    >
                        Remove
                    </Button>
                </Popconfirm>
            );
        }
    } as any);

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
                    <Title level={2}>Members</Title>
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
                            type="default"
                            icon={<PlusOutlined />}
                            onClick={() => setIsInviteModalOpen(true)}
                        >
                            Invite Member
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Create New Member
                        </Button>
                    </div>
                </div>
                <Table
                    dataSource={members}
                    columns={columns}
                    rowKey={(record: any) => record.id || record.userId}
                />

                {/* Invite Member Modal */}
                <Modal
                    title="Invite Member"
                    open={isInviteModalOpen}
                    onCancel={() => setIsInviteModalOpen(false)}
                    footer={null}
                >
                    <Form
                        form={inviteForm}
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
                                <Button onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                                <Button type="primary" htmlType="submit" loading={isInviting}>
                                    Send Invitation
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

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
            </div>
        </>
    );
};
