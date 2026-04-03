import type { WalletAccountDTO } from "@shared";
import { useAdminOrganizations } from "@web/src/features/admin/hooks/useAdminOrganizations";
import { AdminCreditDrawer } from "@web/src/features/wallet/components/AdminCreditDrawer";
import { FinancialAccountCard } from "@web/src/features/wallet/components/FinancialAccountCard";
import { useAdminOrgAccounts } from "@web/src/features/wallet/hooks/useAdminOrgAccounts";
import { useTreasuryBalance } from "@web/src/features/wallet/hooks/useTreasuryBalance";
import { Button, Card, Col, Empty, Row, Select, Tag, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinancialManagementPage: React.FC = () => {
    const [selectedOrgId, setSelectedOrgId] = useState<string>();
    const [creditDrawerOpen, setCreditDrawerOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<WalletAccountDTO>();

    const { data: treasury, isLoading: isLoadingTreasury } = useTreasuryBalance();
    const { data: orgs, isLoading: isLoadingOrgs } = useAdminOrganizations();
    const { data: orgAccountsData, isLoading: isLoadingAccounts } =
        useAdminOrgAccounts(selectedOrgId);

    const handleCardClick = (account: WalletAccountDTO) => {
        setSelectedAccount(account);
        setCreditDrawerOpen(true);
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2} style={{ marginBottom: 32 }}>
                Financial Oversight
            </Title>

            {/* Treasury Health */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Platform Treasury
                    </Title>
                    <Tag color="geekblue" bordered={false} style={{ margin: 0 }}>
                        LIQUIDITY
                    </Tag>
                </div>

                {isLoadingTreasury ? (
                    <Row gutter={[16, 16]}>
                        {[1, 2, 3, 4].map((i) => (
                            <Col xs={24} sm={12} lg={6} key={i}>
                                <Card loading />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Row gutter={[16, 16]}>
                        {treasury?.map((acc: WalletAccountDTO) => (
                            <Col xs={24} sm={12} lg={6} key={acc.id}>
                                <FinancialAccountCard
                                    account={acc}
                                    onClick={handleCardClick}
                                    badgeLabel="TREASURY"
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={8}>
                    <Card title="Organization Context" style={{ height: "100%" }}>
                        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                            Switch between organizations to view ledger balances and perform
                            administrative credits.
                        </Text>
                        <Select
                            style={{ width: "100%" }}
                            size="large"
                            placeholder="Search organizations..."
                            onChange={setSelectedOrgId}
                            showSearch
                            loading={isLoadingOrgs}
                            options={orgs?.items?.map((o: any) => ({ label: o.name, value: o.id }))}
                            optionFilterProp="label"
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    {!selectedOrgId ? (
                        <Card
                            style={{
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "var(--ant-color-fill-quaternary)",
                                border: "1px dashed var(--ant-color-border)",
                            }}
                        >
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Select an organization to begin stewardship"
                            />
                        </Card>
                    ) : (
                        <Card
                            title="Managed Accounts"
                            extra={
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setSelectedAccount(undefined);
                                        setCreditDrawerOpen(true);
                                    }}
                                    disabled={!orgAccountsData?.length}
                                >
                                    Debit/Credit Adjustment
                                </Button>
                            }
                            loading={isLoadingAccounts}
                        >
                            {orgAccountsData && orgAccountsData.length > 0 ? (
                                <Row gutter={[12, 12]}>
                                    {orgAccountsData.map((acc) => (
                                        <Col xs={24} sm={12} key={acc.id}>
                                            <FinancialAccountCard
                                                account={acc}
                                                onClick={handleCardClick}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                !isLoadingAccounts && (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No active accounts for this organization"
                                    />
                                )
                            )}
                        </Card>
                    )}
                </Col>
            </Row>

            <AdminCreditDrawer
                open={creditDrawerOpen}
                onClose={() => setCreditDrawerOpen(false)}
                organizationId={selectedOrgId}
                accounts={orgAccountsData}
                preSelectedAccount={selectedAccount}
            />
        </div>
    );
};
