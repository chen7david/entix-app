import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import {
    type DatePresetOption,
    getRangeFromPreset,
    toIsoRange,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { normalizeDatePresetFilters } from "@web/src/components/data/filter-bar/useDatePresetFilter";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useCursorTableState } from "@web/src/hooks/useCursorTableState";
import { DateUtils } from "@web/src/utils/date";
import { Button, message, Space, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type React from "react";
import { useMemo, useState } from "react";
import {
    useAcknowledgeAuditLog,
    useAdminAuditLogs,
    useRequeueFailedPayment,
} from "../../features/admin/hooks/useAuditLogs";

const { Text } = Typography;
interface AuditLogFilters {
    search?: string;
    severity?: "info" | "warning" | "error" | "critical";
    eventType?: string;
    actorId?: string;
    preset?: string;
    startDate?: string | null;
    endDate?: string | null;
    unresolvedOnly?: boolean;
}

const CUSTOM_RANGE_PRESET = "__custom";
const AUDIT_EVENT_TYPE_OPTIONS = [
    { label: "Payment Failed", value: "payment.failed" },
    { label: "Payment Missed", value: "payment.missed" },
    { label: "Payment Reconciliation Failed", value: "payment.reconciliation-failed" },
    { label: "Session Payment Processed", value: "session_payment_processed" },
];

export const AuditLogPage: React.FC = () => {
    const datePresetOptions = useMemo<DatePresetOption[]>(
        () => [
            { label: "Today", start: DateUtils.startOf("day"), end: DateUtils.endOf("day") },
            {
                label: "This Week",
                start: DateUtils.startOf("week"),
                end: DateUtils.endOf("week"),
            },
            {
                label: "Last Week",
                start: DateUtils.offsetStartOf(-1, "week", "week"),
                end: DateUtils.offsetEndOf(-1, "week", "week"),
            },
            {
                label: "This Month",
                start: DateUtils.startOf("month"),
                end: DateUtils.endOf("month"),
            },
            {
                label: "Last Month",
                start: DateUtils.offsetStartOf(-1, "month", "month"),
                end: DateUtils.offsetEndOf(-1, "month", "month"),
            },
        ],
        []
    );
    const initialDateRange = getRangeFromPreset(datePresetOptions, "This Week");
    const initialIsoRange = initialDateRange
        ? toIsoRange(initialDateRange.start, initialDateRange.end)
        : { startDate: null, endDate: null };
    const initialFilters = useMemo<AuditLogFilters>(
        () => ({
            severity: undefined,
            eventType: undefined,
            actorId: "",
            preset: "This Week",
            startDate: initialIsoRange.startDate,
            endDate: initialIsoRange.endDate,
            unresolvedOnly: false,
        }),
        [initialIsoRange.endDate, initialIsoRange.startDate]
    );

    const tableState = useCursorTableState<AuditLogFilters>({
        initialFilters,
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
            <PageHeader
                title="System Audit Logs"
                subtitle="High-fidelity monitoring of platform events, mission-critical alerts, and billing reconciliation status."
            />

            <Text type="secondary">Showing {data?.items.length || 0} events</Text>

            <div className="min-h-[520px]">
                <DataTableWithFilters
                    config={{
                        columns,
                        data: data?.items || [],
                        loading: isLoading,
                        rowKey: "id",
                        filters: [
                            {
                                type: "select",
                                key: "eventType",
                                placeholder: "Event Type",
                                options: AUDIT_EVENT_TYPE_OPTIONS,
                                showSearch: true,
                            },
                            {
                                type: "search",
                                key: "actorId",
                                placeholder: "Actor ID...",
                            },
                            {
                                type: "select",
                                key: "preset",
                                placeholder: "Date Preset",
                                allowClear: false,
                                options: [
                                    ...datePresetOptions.map((preset) => ({
                                        label: preset.label,
                                        value: preset.label,
                                    })),
                                    { label: "Custom Range", value: CUSTOM_RANGE_PRESET },
                                ],
                            },
                            {
                                type: "dateRange",
                                key: "dateRange",
                                keys: ["startDate", "endDate"],
                                visibleWhen: (values) => values.preset === CUSTOM_RANGE_PRESET,
                            },
                            {
                                type: "select",
                                key: "severity",
                                placeholder: "All Severities",
                                options: [
                                    { label: "Info", value: "info" },
                                    { label: "Warning", value: "warning" },
                                    { label: "Error", value: "error" },
                                    { label: "Critical", value: "critical" },
                                ],
                            },
                            {
                                type: "select",
                                key: "unresolvedOnly",
                                placeholder: "Status",
                                allowClear: false,
                                options: [
                                    { label: "Pending Only", value: true },
                                    { label: "All Events", value: false },
                                ],
                            },
                        ],
                        initialFilters,
                        filterBar: {
                            showReset: true,
                        },
                        onFiltersChange: (next) => {
                            const normalized = normalizeDatePresetFilters({
                                nextFilters: next,
                                previousFilters: tableState.filters,
                                presetOptions: datePresetOptions,
                                customPresetValue: CUSTOM_RANGE_PRESET,
                            });

                            tableState.onFiltersChange({
                                severity: normalized.severity,
                                eventType: normalized.eventType || undefined,
                                actorId: normalized.actorId || undefined,
                                preset: normalized.preset,
                                startDate: normalized.startDate || undefined,
                                endDate: normalized.endDate || undefined,
                                unresolvedOnly: normalized.unresolvedOnly,
                            });
                        },
                        pagination: {
                            pageSize: tableState.pageSize,
                            hasNextPage: !!data?.nextCursor,
                            hasPrevPage: tableState.cursorStack.length > 0,
                            onNext: () => tableState.onNext(data?.nextCursor),
                            onPrev: tableState.onPrev,
                            onPageSizeChange: tableState.onPageSizeChange,
                        },
                    }}
                />
            </div>
        </Space>
    );
};
