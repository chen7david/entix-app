import { PlusCircleOutlined } from "@ant-design/icons";
import { ACCOUNT_TYPES } from "@shared";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import type { FilterConfig } from "@web/src/components/data/FilterBar";
import {
    type DatePresetOption,
    getRangeFromPreset,
    toIsoRange,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { normalizeDatePresetFilters } from "@web/src/components/data/filter-bar/useDatePresetFilter";
import { DataFreshnessControls } from "@web/src/components/data/refresh/DataFreshnessControls";
import { useDataFreshnessControls } from "@web/src/components/data/refresh/useDataFreshnessControls";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { OrgAccountCardGrid } from "@web/src/features/finance/components/OrgAccountCardGrid";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useOrganization } from "@web/src/features/organization";
import { TransferDrawer, useTransactionHistory, useWalletBalance } from "@web/src/features/wallet";
import { useCursorTableState } from "@web/src/hooks/useCursorTableState";
import { useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import { Button, Card, Col, Row, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";

const { Title, Text } = Typography;
const CUSTOM_RANGE_PRESET = "__custom";

type WalletTableFilters = {
    search?: string;
    txId?: string;
    preset?: string;
    startDate?: string | null;
    endDate?: string | null;
    status?: string;
};

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

    const {
        filters,
        cursorStack,
        pageSize,
        currentCursor,
        onFiltersChange,
        onPageSizeChange,
        onNext,
        onPrev,
    } = useCursorTableState<WalletTableFilters>({
        initialFilters: walletInitialFilters,
        initialPageSize: DEFAULT_PAGE_SIZE,
    });
    const [isTransferOpen, setIsTransferOpen] = useState(false);

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
    } = useTransactionHistory(userId, "user", currentCursor, pageSize, orgId, {
        startDate: filters.startDate ?? undefined,
        endDate: filters.endDate ?? undefined,
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
    const savingsAccounts = useMemo(
        () =>
            (summary?.accounts ?? []).map((account) => ({
                ...account,
                accountType: ACCOUNT_TYPES.SAVINGS,
            })),
        [summary?.accounts]
    );

    const handleFiltersChange = (newFilters: Record<string, any>) => {
        const nextFilters = normalizeDatePresetFilters({
            nextFilters: newFilters,
            previousFilters: filters,
            presetOptions: datePresetOptions,
            customPresetValue: CUSTOM_RANGE_PRESET,
        });

        if (areWalletFiltersEqual(nextFilters, filters)) return;

        onFiltersChange(nextFilters);
    };

    return (
        <PageShell>
            <PageHeader
                title="Personal Wallet"
                subtitle="Manage your personal financial accounts within this organization."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusCircleOutlined />}
                        onClick={() => setIsTransferOpen(true)}
                    >
                        New Transfer
                    </Button>
                }
            />

            <div className="mb-4">
                <DataFreshnessControls
                    freshnessLabel={freshnessControls.freshness.label}
                    freshnessTooltip={freshnessControls.freshness.tooltip}
                    status={freshnessControls.freshness.status}
                    isRefreshing={freshnessControls.isFetching}
                    onRefresh={freshnessControls.refreshNow}
                />
            </div>

            <Row gutter={[24, 24]} className="flex-1 min-h-0">
                <Col span={24}>
                    <Title level={4} style={{ marginBottom: 16 }}>
                        Your Accounts
                    </Title>
                    {savingsAccounts.length ? (
                        <OrgAccountCardGrid
                            accounts={savingsAccounts}
                            loading={isLoadingBalance}
                            lowBalanceThresholdCents={10_000}
                        />
                    ) : (
                        <Card style={{ textAlign: "center", padding: "40px 0" }}>
                            <Text type="secondary">
                                No active accounts found in this organization.
                            </Text>
                        </Card>
                    )}
                </Col>

                <Col span={24}>
                    <TransactionLedgerTable
                        transactions={history?.data || []}
                        loading={isFetchingHistory}
                        pagination={{
                            pageSize,
                            hasNextPage: !!history?.nextCursor,
                            hasPrevPage: cursorStack.length > 0,
                            onNext: () => onNext(history?.nextCursor),
                            onPrev,
                            onPageSizeChange,
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
        </PageShell>
    );
};

export default WalletPage;
