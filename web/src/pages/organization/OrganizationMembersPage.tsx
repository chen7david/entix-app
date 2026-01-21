import { useOrganization } from "@web/src/hooks/auth/useOrganization";
import { Table, Typography, Avatar, Tag, Skeleton } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Title } = Typography;

export const OrganizationMembersPage = () => {
    const { members, loading, activeOrganization } = useOrganization();

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
            render: (role: string) => (
                <Tag color={role === 'owner' ? 'gold' : 'blue'}>
                    {role.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Joined At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
    ];

    if (loading) {
        return <Skeleton active />;
    }

    if (!activeOrganization) {
        return <div>Organization not found</div>;
    }

    return (
        <div className="p-6">
            <Title level={2}>Members</Title>
            <Table
                dataSource={members}
                columns={columns}
                rowKey={(record: any) => record.id || record.userId}
            />
        </div>
    );
};
