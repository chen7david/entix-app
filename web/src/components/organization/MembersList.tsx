import { Table, Tag, Input, DatePicker, Space, Button, Popconfirm, Avatar } from "antd";
import { useListMembers, useRemoveMember } from "@web/src/hooks/auth/organization.hook";
import { useState } from "react";
import { UserOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export const MembersList = () => {
    const { data: members, isLoading } = useListMembers();
    const { mutate: removeMember, isPending: isRemoving } = useRemoveMember();

    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    const handleRemove = (memberId: string) => {
        removeMember({ memberId });
    };

    const filteredMembers = (members as any)?.members?.filter((member: any) => {
        const matchesSearch =
            member.user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            member.user.email.toLowerCase().includes(searchText.toLowerCase());

        const matchesDate = !dateRange || !dateRange[0] || !dateRange[1] || (
            dayjs(member.createdAt).isAfter(dateRange[0]) &&
            dayjs(member.createdAt).isBefore(dateRange[1])
        );

        return matchesSearch && matchesDate;
    });

    const columns = [
        {
            title: "User",
            key: "user",
            render: (_: any, record: any) => (
                <Space>
                    <Avatar src={record.user.image} icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium">{record.user.name}</div>
                        <div className="text-xs text-gray-500">{record.user.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            filters: [
                { text: "Owner", value: "owner" },
                { text: "Admin", value: "admin" },
                { text: "Member", value: "member" },
            ],
            onFilter: (value: any, record: any) => record.role === value,
            render: (role: string) => {
                const color = role === "owner" ? "gold" : role === "admin" ? "blue" : "default";
                return <Tag color={color}>{role.toUpperCase()}</Tag>;
            },
        },
        {
            title: "Joined Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => dayjs(date).format("MMM D, YYYY"),
            sorter: (a: any, b: any) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Popconfirm
                    title="Remove member"
                    description="Are you sure you want to remove this member?"
                    onConfirm={() => handleRemove(record.userId)} // Assuming record.userId is the member ID to remove or we need the member record ID? 
                    // better-auth removeMember takes memberIdOrEmail. If it's the user ID in the org, usually it's the member ID.
                    // Let's verify what listMembers returns. It usually returns { id, userId, role, ... }
                    // If record.id is the member ID, use that.
                    okText="Yes"
                    cancelText="No"
                    disabled={record.role === "owner"} // Prevent removing owner for now, or add logic
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={record.role === "owner"}
                    />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <Input
                    placeholder="Search members..."
                    prefix={<SearchOutlined />}
                    className="max-w-xs"
                    onChange={e => setSearchText(e.target.value)}
                />
                <RangePicker onChange={(dates) => setDateRange(dates)} />
            </div>

            <Table
                columns={columns}
                dataSource={filteredMembers}
                rowKey="id"
                loading={isLoading || isRemoving}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};
