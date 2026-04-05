import { CheckCircleOutlined, SendOutlined, WarningOutlined } from "@ant-design/icons";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { type EmailEvent, type EmailRow, useAdminEmails } from "@web/src/features/admin";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { Alert, Card, Col, Row, Statistic, type TableColumnsType, Tag, Typography } from "antd";
import type React from "react";
import { useCallback, useState } from "react";

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
    const [currentCursor, setCurrentCursor] = useState<string | undefined>();
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [limit, setLimit] = useState(20);

    const [debouncedSearch] = useDebouncedValue(searchText, {
        wait: UI_CONSTANTS.DEBOUNCE.SEARCH_TABLE,
    });

    const { data: emailData, isLoading } = useAdminEmails({
        cursor: currentCursor,
        limit,
    });

    const handleNext = useCallback(() => {
        if (emailData?.nextCursor) {
            setCursorStack((prev) => [...prev, currentCursor || ""]);
            setCurrentCursor(emailData.nextCursor);
        }
    }, [emailData?.nextCursor, currentCursor]);

    const handlePrev = useCallback(() => {
        const prevStack = [...cursorStack];
        const prevCursor = prevStack.pop();
        setCursorStack(prevStack);
        setCurrentCursor(prevCursor);
    }, [cursorStack]);

    const rawEmails = emailData?.items ?? [];

    const totalSent = rawEmails.length;
    const delivered = rawEmails.filter(
        (e) =>
            e.last_event === "delivered" || e.last_event === "opened" || e.last_event === "clicked"
    ).length;
    const failed = rawEmails.filter(
        (e) => e.last_event === "bounced" || e.last_event === "complained"
    ).length;

    // Filter logic remains client-side for loaded items
    const filteredEmails = rawEmails.filter((email) => {
        if (!debouncedSearch) return true;
        const lowerSearch = debouncedSearch.toLowerCase();
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
            width: 120,
            render: (event: EmailEvent) => <EventTag event={event} />,
        },
        {
            title: "Sent At",
            dataIndex: "created_at",
            key: "created_at",
            width: 180,
            render: (v: string) => new Date(v).toLocaleString(),
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
                        <Card
                            loading={isLoading}
                            className="border-gray-200 shadow-sm border-none bg-white/50 backdrop-blur-sm"
                        >
                            <Statistic
                                title="Page Emails"
                                value={totalSent}
                                prefix={<SendOutlined className="text-blue-500" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card
                            loading={isLoading}
                            className="border-gray-200 shadow-sm border-none bg-white/50 backdrop-blur-sm"
                        >
                            <Statistic
                                title="Delivered / Active"
                                value={delivered}
                                prefix={<CheckCircleOutlined className="text-green-500" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card
                            loading={isLoading}
                            className="border-gray-200 shadow-sm border-none bg-white/50 backdrop-blur-sm"
                        >
                            <Statistic
                                title="Bounced / Failed"
                                value={failed}
                                prefix={<WarningOutlined className="text-red-500" />}
                                valueStyle={failed > 0 ? { color: "#ff4d4f" } : undefined}
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="h-[calc(100vh-400px)] min-h-[500px]">
                    {searchText && (
                        <Alert
                            message="Local Filter Active"
                            description="This filter only searches the currently visible page of recent emails."
                            type="info"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    <DataTableWithFilters
                        config={{
                            columns,
                            data: filteredEmails,
                            loading: isLoading,
                            filters: [
                                {
                                    type: "search",
                                    key: "search",
                                    placeholder: "Search page items...",
                                },
                            ],
                            onFiltersChange: (f: Record<string, any>) => {
                                setSearchText(f.search || "");
                                setCurrentCursor(undefined);
                                setCursorStack([]);
                            },
                            pagination: {
                                pageSize: limit,
                                hasNextPage: !!emailData?.nextCursor,
                                hasPrevPage: cursorStack.length > 0,
                                onNext: handleNext,
                                onPrev: handlePrev,
                                onPageSizeChange: (s) => {
                                    setLimit(s);
                                    setCurrentCursor(undefined);
                                    setCursorStack([]);
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </>
    );
};
