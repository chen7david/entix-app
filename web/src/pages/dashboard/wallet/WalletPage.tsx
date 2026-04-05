import { InfoCircleOutlined, PlusCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import type { FilterConfig } from "@web/src/components/data/DataTableWithFilters";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useOrganization } from "@web/src/features/organization";
import { TransferDrawer, useTransactionHistory, useWalletBalance } from "@web/src/features/wallet";
import { useSession } from "@web/src/lib/auth-client";
import { Button, Card, Col, Row, Space, Statistic, Tooltip, Typography } from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

export const WalletPage = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // Cursor stack for pagination
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    const currentCursor = cursorStack[cursorStack.length - 1];

    const {
        data: summary,
        isLoading: isLoadingBalance,
        refetch: refetchBalance,
    } = useWalletBalance(userId, "user", orgId);

    const {
        data: history,
        isFetching: isFetchingHistory,
        refetch: refetchHistory,
    } = useTransactionHistory(userId, "user", currentCursor, 20, orgId, {
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
            type: "dateRange",
            key: "dateRange",
            keys: ["startDate", "endDate"],
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

    const handleRefresh = () => {
        refetchBalance();
        refetchHistory();
    };

    const handleFiltersChange = (newFilters: Record<string, any>) => {
        setFilters(newFilters);
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
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={isLoadingBalance || isFetchingHistory}
                        >
                            Refresh
                        </Button>
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
                                                        <Text strong>{acc.name}</Text>
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
                            pageSize: 20,
                            hasNextPage: !!history?.nextCursor,
                            hasPrevPage: cursorStack.length > 0,
                            onNext: handleNext,
                            onPrev: handlePrev,
                        }}
                        filters={filterConfig}
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
