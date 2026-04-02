import { InfoCircleOutlined, PlusCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { useOrganization } from "@web/src/features/organization";
import {
    TransactionTable,
    TransferDrawer,
    useTransactionHistory,
    useWalletBalance,
} from "@web/src/features/wallet";
import { useSession } from "@web/src/lib/auth-client";
import { Button, Card, Col, Row, Space, Statistic, Tooltip, Typography } from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

export const WalletPage = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    const {
        data: summary,
        isLoading: isLoadingBalance,
        refetch: refetchBalance,
    } = useWalletBalance(userId, "user", orgId);

    const {
        data: history,
        isFetching: isFetchingHistory,
        refetch: refetchHistory,
    } = useTransactionHistory(userId, "user", page, pageSize, orgId);

    const handleRefresh = () => {
        refetchBalance();
        refetchHistory();
    };

    return (
        <div style={{ padding: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ marginBottom: 4 }}>
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
                    <Row gutter={[16, 16]}>
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
                    <Card title="Recent Transactions">
                        <TransactionTable
                            transactions={history?.data}
                            loading={isFetchingHistory}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={(p, ps) => {
                                setPage(p);
                                setPageSize(ps);
                            }}
                        />
                    </Card>
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
