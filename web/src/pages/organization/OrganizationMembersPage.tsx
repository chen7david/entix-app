import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Table, Typography, Avatar, Tag, Skeleton, Select, Button, Popconfirm, message, Tooltip, Space } from "antd";
import { UserOutlined, DeleteOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useAuth } from "@web/src/hooks/auth/auth.hook";

const { Title } = Typography;

export const OrganizationMembersPage = () => {
    const {
        members,
        loading,
        activeOrganization,
        updateMemberRoles,
        removeMember,
        checkPermission,
        userRoles: currentUserRoles,
    } = useOrganization();

    const { session } = useAuth();
    const currentUserId = session.data?.user?.id;

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
                    onConfirm={() => handleRemoveMember(record.userId || record.user.id)}
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
                    />
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
                </div>
                <Table
                    dataSource={members}
                    columns={columns}
                    rowKey={(record: any) => record.id || record.userId}
                />
            </div>
        </>
    );
};
