import { PlusCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useOrganization } from "@web/src/features/organization";
import {
    CreateAccountDrawer,
    TransactionTable,
    TransferDrawer,
    useTransactionHistory,
    useWalletBalance,
    WalletSummaryCard,
} from "@web/src/features/wallet";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

export const WalletPage = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

    const {
        data: summary,
        isLoading: isLoadingBalance,
        refetch: refetchBalance,
    } = useWalletBalance(orgId);

    const {
        data: history,
        isFetching: isFetchingHistory,
        refetch: refetchHistory,
    } = useTransactionHistory(orgId, page, pageSize);

    const handleRefresh = () => {
        refetchBalance();
        refetchHistory();
    };

    return (
        <div style={{ padding: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2}>Wallet & Ledger</Title>
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
                        <Button onClick={() => setIsCreateAccountOpen(true)}>New Account</Button>
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
                <Col span={24} lg={8}>
                    <WalletSummaryCard accounts={summary?.accounts} loading={isLoadingBalance} />
                </Col>

                <Col span={24} lg={16}>
                    <Card title="Transaction History">
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

            <CreateAccountDrawer
                open={isCreateAccountOpen}
                onClose={() => setIsCreateAccountOpen(false)}
                orgId={orgId}
            />
        </div>
    );
};

export default WalletPage;
