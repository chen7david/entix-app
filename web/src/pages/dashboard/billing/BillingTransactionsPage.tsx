import {
    CheckCircleOutlined,
    InteractionOutlined,
    RollbackOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import type { FilterConfig } from "@web/src/components/data/DataTableWithFilters";
import {
    type DatePresetOption,
    getRangeFromPreset,
    toIsoRange,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { normalizeDatePresetFilters } from "@web/src/components/data/filter-bar/useDatePresetFilter";
import { DataFreshnessControls } from "@web/src/components/data/refresh/DataFreshnessControls";
import { useDataFreshnessControls } from "@web/src/components/data/refresh/useDataFreshnessControls";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useReverseTransaction } from "@web/src/features/finance/hooks/useReverseTransaction";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Typography } from "antd";
import type React from "react";
import { useCallback, useMemo, useState } from "react";

const { Title, Text } = Typography;
const CUSTOM_RANGE_PRESET = "__custom";

function areBillingTransactionFiltersEqual(
    a: Record<string, any>,
    b: Record<string, any>
): boolean {
    return (
        (a.txId ?? "") === (b.txId ?? "") &&
        (a.preset ?? "") === (b.preset ?? "") &&
        (a.startDate ?? null) === (b.startDate ?? null) &&
        (a.endDate ?? null) === (b.endDate ?? null) &&
        (a.status ?? undefined) === (b.status ?? undefined)
    );
}

export const BillingTransactionsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    const datePresetOptions = useMemo<DatePresetOption[]>(
        () => [
            {
                label: "Today",
                start: DateUtils.startOf("day"),
                end: DateUtils.endOf("day"),
            },
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
    const billingTransactionInitialFilters = useMemo(() => {
        const defaultDateRange = getRangeFromPreset(datePresetOptions, "Today");
        const defaultIsoRange = defaultDateRange
            ? toIsoRange(defaultDateRange.start, defaultDateRange.end)
            : { startDate: null, endDate: null };
        return {
            txId: "",
            preset: "Today",
            startDate: defaultIsoRange.startDate,
            endDate: defaultIsoRange.endDate,
            status: undefined,
        };
    }, [datePresetOptions]);

    // Cursor stack: navigate forward/back by pushing/popping cursors
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, any>>(billingTransactionInitialFilters);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const currentCursor = cursorStack[cursorStack.length - 1];

    const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useTransactions(orgId, {
        cursor: currentCursor,
        limit: pageSize,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        txId: filters.txId || undefined,
    });

    const { mutate: reverse, isPending: isReversing, variables } = useReverseTransaction(orgId);
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);
    const freshnessControls = useDataFreshnessControls({
        lastFetchedAt: dataUpdatedAt,
        isFetching,
        onRefresh: handleRefresh,
    });

    const filterConfig: FilterConfig[] = [
        {
            type: "search",
            key: "txId",
            placeholder: "Transaction ID",
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
            key: "status",
            placeholder: "All Statuses",
            options: [
                { label: "Completed", value: "completed" },
                { label: "Reversed", value: "reversed" },
                { label: "Pending", value: "pending" },
            ],
        },
    ];

    const handleFiltersChange = (newFilters: Record<string, any>) => {
        const nextFilters = normalizeDatePresetFilters({
            nextFilters: newFilters,
            previousFilters: filters,
            presetOptions: datePresetOptions,
            customPresetValue: CUSTOM_RANGE_PRESET,
        });

        if (areBillingTransactionFiltersEqual(nextFilters, filters)) {
            return;
        }

        setFilters(nextFilters);
        setCursorStack([]); // Reset to first page on filter change
    };

    const handleNext = () => {
        if (data?.nextCursor) {
            setCursorStack((prev) => [...prev, data.nextCursor as string]);
        }
    };

    const handlePrev = () => {
        setCursorStack((prev) => prev.slice(0, -1));
    };

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Transaction Ledger
                </Title>
                <Text type="secondary" className="text-base">
                    A comprehensive, immutable record of all organizational billing transactions and
                    reversals.
                </Text>
                <div style={{ marginTop: 12 }}>
                    <DataFreshnessControls
                        freshnessLabel={freshnessControls.freshness.label}
                        freshnessTooltip={freshnessControls.freshness.tooltip}
                        status={freshnessControls.freshness.status}
                        isRefreshing={freshnessControls.isFetching}
                        onRefresh={freshnessControls.refreshNow}
                    />
                </div>
            </div>

            <SummaryCardsRow
                loading={isLoading}
                items={[
                    {
                        key: "total",
                        label: "Ledger Records",
                        value: data?.items?.length || 0,
                        icon: <InteractionOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "completed",
                        label: "Completed",
                        value: data?.items?.filter((t) => t.status === "completed").length || 0,
                        icon: <CheckCircleOutlined />,
                        color: "#10b981",
                    },
                    {
                        key: "pending",
                        label: "Pending",
                        value: data?.items?.filter((t) => t.status === "pending").length || 0,
                        icon: <SyncOutlined />,
                        color: "#f59e0b",
                    },
                    {
                        key: "reversed",
                        label: "Reversed",
                        value: data?.items?.filter((t) => t.status === "reversed").length || 0,
                        icon: <RollbackOutlined />,
                        color: "#ef4444",
                    },
                ]}
            />

            <TransactionLedgerTable
                transactions={data?.items || []}
                loading={isLoading}
                onReverse={(txId, reason) => reverse({ txId, reason })}
                isReversing={isReversing ? variables?.txId : null}
                pagination={{
                    pageSize,
                    hasNextPage: !!data?.nextCursor,
                    hasPrevPage: cursorStack.length > 0,
                    onNext: handleNext,
                    onPrev: handlePrev,
                    onPageSizeChange: (size: number) => {
                        setPageSize(size);
                        setCursorStack([]); // Reset on size change
                    },
                }}
                filters={filterConfig}
                initialFilters={billingTransactionInitialFilters}
                onFiltersChange={handleFiltersChange}
            />
        </div>
    );
};
