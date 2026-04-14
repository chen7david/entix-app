import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { useCursorTableState } from "@web/src/hooks/useCursorTableState";
import { Button, Card, Col, message, Row, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type React from "react";
import { useState } from "react";
import {
    useAcknowledgeAuditLog,
    useAdminAuditLogs,
    useRequeueFailedPayment,
} from "../../features/admin/hooks/useAuditLogs";

const { Title, Text } = Typography;
const { Option } = Select;

interface AuditLogFilters {
    search?: string;
    severity?: "info" | "warning" | "error" | "critical";
    unresolvedOnly?: boolean;
}

export const AuditLogPage: React.FC = () => {
    const tableState = useCursorTableState<AuditLogFilters>({
        initialFilters: {
            search: undefined,
            severity: undefined,
            unresolvedOnly: false,
        },
    });

    const { data, isPending: isLoading } = useAdminAuditLogs({
        ...tableState.filters,
        cursor: tableState.currentCursor,
        limit: tableState.pageSize,
    });

    const { mutate: acknowledge, isPending: isAcknowledging } = useAcknowledgeAuditLog();
    const { mutate: requeue, isPending: isRequeueing } = useRequeueFailedPayment();
    const [requeueingId, setRequeueingId] = useState<string | null>(null);

    const handleAcknowledge = (id: string) => {
        acknowledge(id, {
            onSuccess: () => message.success("Alert acknowledged"),
            onError: (err) => message.error(err.message),
        });
    };

    const handleRequeue = (record: any) => {
        setRequeueingId(record.id);
        const meta = JSON.parse(record.metadata ?? "{}");
        requeue(
            { eventId: meta.eventId ?? record.subjectId, organizationId: record.organizationId },
            {
                onSuccess: () => {
                    message.success("Payment re-queued for retry");
                    setRequeueingId(null);
                },
                onError: (err) => {
                    message.error(err.message);
                    setRequeueingId(null);
                },
            }
        );
    };

    const columns: ColumnsType<any> = [
        {
            title: "Timestamp",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 180,
            render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "Severity",
            dataIndex: "severity",
            key: "severity",
            width: 120,
            render: (severity: string) => {
                const colors = {
                    info: "blue",
                    warning: "orange",
                    error: "red",
                    critical: "magenta",
                };
                const icons = {
                    info: <InfoCircleOutlined />,
                    warning: <WarningOutlined />,
                    error: <ExclamationCircleOutlined />,
                    critical: <ExclamationCircleOutlined />,
                };
                return (
                    <Tag
                        icon={icons[severity as keyof typeof icons]}
                        color={colors[severity as keyof typeof colors]}
                    >
                        {severity.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: "Event",
            dataIndex: "eventType",
            key: "eventType",
            width: 150,
            render: (type: string) => <Text strong>{type}</Text>,
        },
        {
            title: "Message",
            dataIndex: "message",
            key: "message",
        },
        {
            title: "Subject",
            key: "subject",
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        {record.subjectType}
                    </Text>
                    <Text code>{record.subjectId}</Text>
                </Space>
            ),
        },
        {
            title: "Status",
            key: "status",
            width: 150,
            render: (_, record) =>
                record.acknowledgedAt ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Resolved
                    </Tag>
                ) : (
                    <Tag color="default">Pending</Tag>
                ),
        },
        {
            title: "Action",
            key: "action",
            width: 160,
            render: (_, record) => {
                if (record.acknowledgedAt) return null;
                return (
                    <Space size="small">
                        <Button
                            type="link"
                            size="small"
                            onClick={() => handleAcknowledge(record.id)}
                            loading={isAcknowledging}
                        >
                            Acknowledge
                        </Button>
                        {record.eventType === "payment.reconciliation-failed" && (
                            <Button
                                type="primary"
                                size="small"
                                danger
                                onClick={() => handleRequeue(record)}
                                loading={isRequeueing && requeueingId === record.id}
                            >
                                Requeue
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
                <Title level={2} style={{ margin: 0 }}>
                    System Audit Logs
                </Title>
                <Text type="secondary">
                    Monitor platform events, alerts, and billing reconciliation status
                </Text>
            </div>

            <Card size="small">
                <Row gutter={16} align="middle">
                    <Col span={6}>
                        <Text type="secondary">Severity</Text>
                        <Select
                            placeholder="All Severities"
                            style={{ width: "100%", marginTop: 4 }}
                            allowClear
                            onChange={(val) => tableState.onFiltersChange({ severity: val })}
                        >
                            <Option value="info">Info</Option>
                            <Option value="warning">Warning</Option>
                            <Option value="error">Error</Option>
                            <Option value="critical">Critical</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Text type="secondary">Status</Text>
                        <Select
                            defaultValue={true}
                            style={{ width: "100%", marginTop: 4 }}
                            onChange={(val: any) =>
                                tableState.onFiltersChange({ unresolvedOnly: val })
                            }
                        >
                            <Option value={true}>Pending Only</Option>
                            <Option value={false}>All Events</Option>
                        </Select>
                    </Col>
                </Row>
            </Card>

            <Table
                columns={columns}
                dataSource={data?.items || []}
                loading={isLoading}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1000 }}
                footer={() => (
                    <div className="flex justify-between items-center px-4">
                        <Text type="secondary">Showing {data?.items.length || 0} events</Text>
                        <Space>
                            <Button
                                onClick={tableState.onPrev}
                                disabled={tableState.cursorStack.length === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => tableState.onNext(data?.nextCursor)}
                                disabled={!data?.nextCursor}
                            >
                                Next
                            </Button>
                        </Space>
                    </div>
                )}
            />
        </Space>
    );
};
