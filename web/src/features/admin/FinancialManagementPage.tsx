import { CheckCircleOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG, type WalletAccountDTO } from "@shared";
import { useAdminOrganizations } from "@web/src/features/admin/hooks/useAdminOrganizations";
import { AdminCreditDrawer } from "@web/src/features/wallet/components/AdminCreditDrawer";
import { useAdminOrgAccounts } from "@web/src/features/wallet/hooks/useAdminOrgAccounts";
import { useTreasuryBalance } from "@web/src/features/wallet/hooks/useTreasuryBalance";
import { Button, Card, Col, Empty, Row, Select, Statistic, Tag, Typography } from "antd";
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
                        {treasury?.map((acc: WalletAccountDTO) => {
                            const config =
                                FINANCIAL_CURRENCY_CONFIG[
                                    acc.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                                ];
                            const isLow = acc.balanceCents < 100_000_00; // $1,000 alert

                            return (
                                <Col xs={24} sm={12} lg={6} key={acc.id}>
                                    <Card
                                        hoverable
                                        variant="borderless"
                                        onClick={() => handleCardClick(acc)}
                                        style={{
                                            height: "100%",
                                            borderLeft: isLow
                                                ? "4px solid var(--ant-color-warning)"
                                                : undefined,
                                        }}
                                    >
                                        <Statistic
                                            title={
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Text
                                                        strong
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 11,
                                                            textTransform: "uppercase",
                                                        }}
                                                    >
                                                        {acc.name}
                                                    </Text>
                                                    {isLow && (
                                                        <Tag
                                                            color="warning"
                                                            bordered={false}
                                                            style={{ margin: 0 }}
                                                        >
                                                            Low Balance
                                                        </Tag>
                                                    )}
                                                </div>
                                            }
                                            value={acc.balanceCents / 100}
                                            precision={2}
                                            prefix={config?.symbol}
                                            suffix={
                                                <Text
                                                    type="secondary"
                                                    style={{ fontSize: 12, marginLeft: 4 }}
                                                >
                                                    {config?.code}
                                                </Text>
                                            }
                                            valueStyle={{ fontWeight: 700 }}
                                        />
                                        <div style={{ marginTop: 12 }}>
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 9,
                                                    fontFamily: "monospace",
                                                    opacity: 0.5,
                                                }}
                                            >
                                                {acc.id}
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
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
                                            <Card
                                                hoverable
                                                size="small"
                                                onClick={() => handleCardClick(acc)}
                                            >
                                                <Statistic
                                                    title={
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                        >
                                                            <Text strong style={{ fontSize: 12 }}>
                                                                {acc.name}
                                                            </Text>
                                                            {acc.isActive && (
                                                                <Tag
                                                                    color="success"
                                                                    bordered={false}
                                                                    icon={<CheckCircleOutlined />}
                                                                    style={{
                                                                        margin: 0,
                                                                        fontSize: 10,
                                                                    }}
                                                                >
                                                                    Active
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    }
                                                    value={(acc.balanceCents / 100).toFixed(2)}
                                                    prefix={
                                                        FINANCIAL_CURRENCY_CONFIG[
                                                            acc.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                                                        ]?.symbol ?? "$"
                                                    }
                                                    suffix={
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 10 }}
                                                        >
                                                            {acc.currencyId.split("_").pop()}
                                                        </Text>
                                                    }
                                                    valueStyle={{ fontSize: 20, fontWeight: 600 }}
                                                />
                                            </Card>
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
