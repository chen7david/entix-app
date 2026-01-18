import { Table, Tag, Input, DatePicker, Button, Popconfirm } from "antd";
import { useListInvitations, useCancelInvitation } from "@web/src/hooks/auth/organization.hook";
import { useState } from "react";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export const InvitationsTable = () => {
    const { data: invitations, isLoading } = useListInvitations();
    const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation();

    const [searchText, setSearchText] = useState("");
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    const handleCancel = (invitationId: string) => {
        cancelInvitation({ invitationId });
    };

    const filteredInvitations = invitations?.filter((inv: any) => {
        const matchesSearch = inv.email.toLowerCase().includes(searchText.toLowerCase());

        const matchesDate = !dateRange || !dateRange[0] || !dateRange[1] || (
            dayjs(inv.createdAt).isAfter(dateRange[0]) &&
            dayjs(inv.createdAt).isBefore(dateRange[1])
        );

        // Filter out cancelled invitations if desired, or keep them and show status
        // User asked to "view all invitatiaon but provide antd filtering"
        // So we should probably show all but allow filtering by status in the table
        return matchesSearch && matchesDate;
    });

    const columns = [
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role: string) => <Tag>{role.toUpperCase()}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: "Pending", value: "pending" },
                { text: "Accepted", value: "accepted" },
                { text: "Canceled", value: "canceled" },
                { text: "Rejected", value: "rejected" },
            ],
            onFilter: (value: any, record: any) => record.status === value,
            render: (status: string) => {
                let color = "default";
                if (status === "pending") color = "processing";
                if (status === "accepted") color = "success";
                if (status === "canceled") color = "default";
                if (status === "rejected") color = "error";
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: "Sent Date",
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
                    title="Cancel invitation"
                    description="Are you sure you want to cancel this invitation?"
                    onConfirm={() => handleCancel(record.id)}
                    okText="Yes"
                    cancelText="No"
                    disabled={record.status !== "pending"}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={record.status !== "pending"}
                    />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <Input
                    placeholder="Search email..."
                    prefix={<SearchOutlined />}
                    className="max-w-xs"
                    onChange={e => setSearchText(e.target.value)}
                />
                <RangePicker onChange={(dates) => setDateRange(dates)} />
            </div>

            <Table
                columns={columns}
                dataSource={filteredInvitations}
                rowKey="id"
                loading={isLoading || isCancelling}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};
