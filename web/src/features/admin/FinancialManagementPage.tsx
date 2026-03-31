import { CheckCircleOutlined } from "@ant-design/icons";
import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { useAdminOrganizations } from "@web/src/features/admin/hooks/useAdminOrganizations";
import { AdminCreditDrawer } from "@web/src/features/wallet/components/AdminCreditDrawer";
import { useAdminOrgAccounts } from "@web/src/features/wallet/hooks/useAdminOrgAccounts";
import { useTreasuryBalance } from "@web/src/features/wallet/hooks/useTreasuryBalance";
import type { WalletAccount } from "@web/src/features/wallet/hooks/useWalletBalance";
import { Alert, Button, Card, Col, Empty, Row, Select, Statistic, Tag, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinancialManagementPage: React.FC = () => {
    const [selectedOrgId, setSelectedOrgId] = useState<string>();
    const [creditDrawerOpen, setCreditDrawerOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<WalletAccount>();

    const { data: treasury, isLoading: isLoadingTreasury } = useTreasuryBalance();
    const { data: orgs, isLoading: isLoadingOrgs } = useAdminOrganizations();
    const { data: orgAccountsData, isLoading: isLoadingAccounts } =
        useAdminOrgAccounts(selectedOrgId);

    const lowTreasury = treasury && treasury.balanceCents < 1_000_000_00; // alert below $1M

    const handleCardClick = (account: WalletAccount) => {
        setSelectedAccount(account);
        setCreditDrawerOpen(true);
    };

    return (
        <div className="p-6">
            <Title level={2}>Financial Management</Title>

            {/* Treasury Health */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={24} align="middle">
                    <Col>
                        <Statistic
                            title="Platform Treasury Balance"
                            value={treasury?.balanceFormatted ?? "Loading..."}
                            valueStyle={{ color: lowTreasury ? "#cf1322" : "#3f8600" }}
                            loading={isLoadingTreasury}
                        />
                    </Col>
                    {lowTreasury && !isLoadingTreasury && (
                        <Col>
                            <Alert
                                type="warning"
                                title="Treasury balance is below $1,000,000 — top up required"
                                showIcon
                            />
                        </Col>
                    )}
                </Row>
            </Card>

            {/* Org Selector */}
            <Card title="Select Organization" style={{ marginBottom: 24 }}>
                <Select
                    style={{ width: 400 }}
                    placeholder="Select an organization to manage"
                    onChange={setSelectedOrgId}
                    showSearch
                    loading={isLoadingOrgs}
                    options={orgs?.map((o: any) => ({ label: o.name, value: o.id }))}
                    optionFilterProp="label"
                />
            </Card>

            {/* Org Accounts */}
            {!selectedOrgId ? (
                <Card bordered={false} style={{ background: "transparent" }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Text type="secondary">
                                Select an organization above to view its accounts
                            </Text>
                        }
                    />
                </Card>
            ) : (
                <Card
                    title="Organization Accounts"
                    extra={
                        <Button
                            type="primary"
                            onClick={() => {
                                setSelectedAccount(undefined);
                                setCreditDrawerOpen(true);
                            }}
                            disabled={!orgAccountsData?.accounts?.length}
                        >
                            Credit Account
                        </Button>
                    }
                    loading={isLoadingAccounts}
                >
                    {orgAccountsData?.accounts && orgAccountsData.accounts.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {orgAccountsData.accounts.map((acc) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={acc.id}>
                                    <Card
                                        hoverable
                                        variant="borderless"
                                        onClick={() => handleCardClick(acc)}
                                        style={{ height: "100%" }}
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
                                                    <span
                                                        style={{
                                                            maxWidth: "70%",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {acc.name}
                                                    </span>
                                                    {acc.isActive && (
                                                        <Tag
                                                            color="green"
                                                            icon={<CheckCircleOutlined />}
                                                            style={{ marginRight: 0 }}
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
                                            suffix={acc.currencyId.split("_")[1].toUpperCase()}
                                        />
                                        <div style={{ marginTop: 12 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                ID: {acc.id}
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        !isLoadingAccounts && (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div style={{ textAlign: "center" }}>
                                        <Text strong>No active financial accounts yet.</Text>
                                        <br />
                                        <Text type="secondary">
                                            Ask the organization admin to activate currencies first.
                                        </Text>
                                    </div>
                                }
                            />
                        )
                    )}
                </Card>
            )}

            <AdminCreditDrawer
                open={creditDrawerOpen}
                onClose={() => setCreditDrawerOpen(false)}
                organizationId={selectedOrgId}
                accounts={orgAccountsData?.accounts}
                preSelectedAccount={selectedAccount}
            />
        </div>
    );
};
