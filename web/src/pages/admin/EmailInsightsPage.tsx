import {
    CheckCircleOutlined,
    SearchOutlined,
    SendOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import {
    type EmailEvent,
    type EmailRow,
    useAdminEmails,
} from "@web/src/hooks/admin/useAdminEmails";
import {
    Alert,
    Card,
    Col,
    Input,
    Row,
    Statistic,
    Table,
    type TableColumnsType,
    Tag,
    Typography,
} from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

const eventTagProps: Record<string, { color: string; label: string }> = {
    delivered: { color: "green", label: "Delivered" },
    opened: { color: "blue", label: "Opened" },
    clicked: { color: "cyan", label: "Clicked" },
    sent: { color: "default", label: "Sent" },
    bounced: { color: "red", label: "Bounced" },
    complained: { color: "orange", label: "Complained" },
    delivery_delayed: { color: "gold", label: "Delayed" },
};

const EventTag: React.FC<{ event: EmailEvent }> = ({ event }) => {
    if (!event) return <Tag>Unknown</Tag>;
    const props = eventTagProps[event] ?? { color: "default", label: event };
    return <Tag color={props.color}>{props.label}</Tag>;
};

export const EmailInsightsPage: React.FC = () => {
    const [searchText, setSearchText] = useState("");

    const { data, isLoading } = useAdminEmails();

    const rawEmails = data?.data ?? [];

    const totalSent = rawEmails.length;
    const delivered = rawEmails.filter(
        (e) =>
            e.last_event === "delivered" || e.last_event === "opened" || e.last_event === "clicked"
    ).length;
    const failed = rawEmails.filter(
        (e) => e.last_event === "bounced" || e.last_event === "complained"
    ).length;

    const emails = rawEmails.filter((email) => {
        if (!searchText) return true;
        const lowerSearch = searchText.toLowerCase();
        const matchesTo = email.to?.some((address) => address.toLowerCase().includes(lowerSearch));
        const matchesSubject = email.subject?.toLowerCase().includes(lowerSearch);
        return matchesTo || matchesSubject;
    });

    const columns: TableColumnsType<EmailRow> = [
        {
            title: "To",
            dataIndex: "to",
            key: "to",
            render: (to: string[] | null) => <Text>{to?.join(", ") ?? "-"}</Text>,
        },
        {
            title: "Subject",
            dataIndex: "subject",
            key: "subject",
            render: (subject: string | null) => <Text>{subject ?? "(no subject)"}</Text>,
        },
        {
            title: "Status",
            dataIndex: "last_event",
            key: "last_event",
            render: (event: EmailEvent) => <EventTag event={event} />,
            filters: Object.entries(eventTagProps).map(([key, { label }]) => ({
                text: label,
                value: key,
            })),
            onFilter: (value, record) => record.last_event === value,
        },
        {
            title: "Sent At",
            dataIndex: "created_at",
            key: "created_at",
            render: (v: string) => new Date(v).toLocaleString(),
            sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            defaultSortOrder: "descend",
        },
    ];

    return (
        <>
            <Toolbar />
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Email Insights
                        </Title>
                        <Text type="secondary">
                            Monitor email delivery status and activity via Resend
                        </Text>
                    </div>
                </div>

                <Row gutter={16} className="mb-8">
                    <Col xs={24} sm={8}>
                        <Card loading={isLoading} className="border-gray-200 shadow-sm">
                            <Statistic
                                title="Total Emails"
                                value={totalSent}
                                prefix={<SendOutlined className="text-blue-500" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card loading={isLoading} className="border-gray-200 shadow-sm">
                            <Statistic
                                title="Delivered / Opened / Clicked"
                                value={delivered}
                                prefix={<CheckCircleOutlined className="text-green-500" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card loading={isLoading} className="border-gray-200 shadow-sm">
                            <Statistic
                                title="Bounced / Complained"
                                value={failed}
                                prefix={<WarningOutlined className="text-red-500" />}
                                valueStyle={failed > 0 ? { color: "#ff4d4f" } : undefined}
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="space-y-4">
                    <Input
                        placeholder="Search by email or subject..."
                        prefix={<SearchOutlined />}
                        className="max-w-xs"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                    />

                    {searchText && (
                        <Alert
                            message="Local Filter Active"
                            description="This filter only searches the currently visible page of recent emails. If you don't see your expected result, the email might have been sent before the loaded timeframe."
                            type="info"
                            showIcon
                        />
                    )}

                    <Table<EmailRow>
                        dataSource={emails}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 20, showSizeChanger: false }}
                        locale={{ emptyText: "No emails found" }}
                    />
                </div>
            </div>
        </>
    );
};
