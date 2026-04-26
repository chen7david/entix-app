import { InfoCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import type { FilterConfig } from "@web/src/components/data/DataTableWithFilters";
import { DataFreshnessControls } from "@web/src/components/data/refresh/DataFreshnessControls";
import {
    type DatePresetOption,
    getRangeFromPreset,
    toIsoRange,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { normalizeDatePresetFilters } from "@web/src/components/data/filter-bar/useDatePresetFilter";
import { useDataFreshnessControls } from "@web/src/components/data/refresh/useDataFreshnessControls";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useOrganization } from "@web/src/features/organization";
import { TransferDrawer, useTransactionHistory, useWalletBalance } from "@web/src/features/wallet";
import { formatAccountDisplayName } from "@web/src/lib/account-display";
import { useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import { Button, Card, Col, Row, Space, Statistic, Tooltip, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";

const { Title, Text } = Typography;
const CUSTOM_RANGE_PRESET = "__custom";

function areWalletFiltersEqual(a: Record<string, any>, b: Record<string, any>): boolean {
    return (
        (a.txId ?? "") === (b.txId ?? "") &&
        (a.preset ?? "") === (b.preset ?? "") &&
        (a.startDate ?? null) === (b.startDate ?? null) &&
        (a.endDate ?? null) === (b.endDate ?? null) &&
        (a.status ?? undefined) === (b.status ?? undefined)
    );
}

export const WalletPage = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

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
    const walletInitialFilters = useMemo(() => {
        const today = getRangeFromPreset(datePresetOptions, "Today");
        const todayIso = today
            ? toIsoRange(today.start, today.end)
            : { startDate: null, endDate: null };
        return {
            txId: "",
            preset: "Today",
            startDate: todayIso.startDate,
            endDate: todayIso.endDate,
            status: undefined,
        };
    }, [datePresetOptions]);

    // Cursor stack for pagination
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, any>>(walletInitialFilters);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    const currentCursor = cursorStack[cursorStack.length - 1];

    const {
        data: summary,
        isLoading: isLoadingBalance,
        isFetching: isFetchingBalance,
        dataUpdatedAt: balanceUpdatedAt,
        refetch: refetchBalance,
    } = useWalletBalance(userId, "user", orgId);

    const {
        data: history,
        isFetching: isFetchingHistory,
        dataUpdatedAt: historyUpdatedAt,
        refetch: refetchHistory,
    } = useTransactionHistory(userId, "user", currentCursor, DEFAULT_PAGE_SIZE, orgId, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        txId: filters.txId,
    });

    const filterConfig: FilterConfig[] = [
        {
            type: "search",
            key: "txId",
            placeholder: "Search ID...",
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
            placeholder: "Status",
            options: [
                { label: "Completed", value: "completed" },
                { label: "Reversed", value: "reversed" },
                { label: "Pending", value: "pending" },
            ],
        },
    ];

    const handleRefresh = useCallback(() => {
        refetchBalance();
        refetchHistory();
    }, [refetchBalance, refetchHistory]);

    const lastFetchedAt = useMemo(() => {
        if (!balanceUpdatedAt && !historyUpdatedAt) return undefined;
        return Math.max(balanceUpdatedAt || 0, historyUpdatedAt || 0);
    }, [balanceUpdatedAt, historyUpdatedAt]);

    const freshnessControls = useDataFreshnessControls({
        lastFetchedAt,
        isFetching: isFetchingBalance || isFetchingHistory,
        onRefresh: handleRefresh,
    });

    const handleFiltersChange = (newFilters: Record<string, any>) => {
        const nextFilters = normalizeDatePresetFilters({
            nextFilters: newFilters,
            previousFilters: filters,
            presetOptions: datePresetOptions,
            customPresetValue: CUSTOM_RANGE_PRESET,
        });

        if (areWalletFiltersEqual(nextFilters, filters)) return;

        setFilters(nextFilters);
        setCursorStack([]); // Reset to first page on filter change
    };

    const handleNext = () => {
        if (history?.nextCursor) {
            setCursorStack((prev) => [...prev, history.nextCursor as string]);
        }
    };

    const handlePrev = () => {
        setCursorStack((prev) => prev.slice(0, -1));
    };

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        Personal Wallet
                    </Title>
                    <Typography.Text type="secondary">
                        Manage your personal financial accounts within this organization.
                    </Typography.Text>
                </Col>
                <Col>
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusCircleOutlined />}
                            onClick={() => setIsTransferOpen(true)}
                        >
                            New Transfer
                        </Button>
                    </Space>
                </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
                <DataFreshnessControls
                    freshnessLabel={freshnessControls.freshness.label}
                    freshnessTooltip={freshnessControls.freshness.tooltip}
                    status={freshnessControls.freshness.status}
                    isRefreshing={freshnessControls.isFetching}
                    onRefresh={freshnessControls.refreshNow}
                />
            </div>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        Your Accounts
                    </Title>
                    <Row gutter={[24, 24]}>
                        {isLoadingBalance ? (
                            [1, 2].map((i) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={i}>
                                    <Card loading />
                                </Col>
                            ))
                        ) : summary?.accounts.length ? (
                            summary.accounts.map((acc) => {
                                const config =
                                    FINANCIAL_CURRENCY_CONFIG[
                                        acc.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                                    ];
                                return (
                                    <Col xs={24} sm={12} md={8} lg={6} key={acc.id}>
                                        <Card
                                            hoverable
                                            style={{
                                                borderStyle: acc.isActive ? "solid" : "dashed",
                                                opacity: acc.isActive ? 1 : 0.6,
                                            }}
                                        >
                                            <Statistic
                                                title={
                                                    <div className="flex items-center gap-2">
                                                        <Text strong>
                                                            {formatAccountDisplayName(
                                                                acc.name,
                                                                config?.code
                                                            )}
                                                        </Text>
                                                        <Tooltip
                                                            title={
                                                                acc.isActive ? "Active" : "Inactive"
                                                            }
                                                        >
                                                            <InfoCircleOutlined
                                                                style={{
                                                                    color: acc.isActive
                                                                        ? "#52c41a"
                                                                        : "#faad14",
                                                                    fontSize: 12,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                }
                                                value={acc.balanceCents / 100}
                                                precision={2}
                                                prefix={config?.symbol}
                                                suffix={config?.code}
                                                valueStyle={{ fontSize: 24, fontWeight: 600 }}
                                            />
                                        </Card>
                                    </Col>
                                );
                            })
                        ) : (
                            <Col span={24}>
                                <Card style={{ textAlign: "center", padding: "40px 0" }}>
                                    <Text type="secondary">
                                        No active accounts found in this organization.
                                    </Text>
                                </Card>
                            </Col>
                        )}
                    </Row>
                </Col>

                <Col span={24}>
                    <TransactionLedgerTable
                        transactions={history?.data || []}
                        loading={isFetchingHistory}
                        pagination={{
                            pageSize: DEFAULT_PAGE_SIZE,
                            hasNextPage: !!history?.nextCursor,
                            hasPrevPage: cursorStack.length > 0,
                            onNext: handleNext,
                            onPrev: handlePrev,
                        }}
                        filters={filterConfig}
                        initialFilters={walletInitialFilters}
                        onFiltersChange={handleFiltersChange}
                    />
                </Col>
            </Row>

            <TransferDrawer
                open={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                orgId={orgId}
                accounts={summary?.accounts}
            />
        </div>
    );
};

export default WalletPage;
