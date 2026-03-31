import { useAdminOrganizations } from "@web/src/features/admin/hooks/useAdminOrganizations";
import { AdminCreditDrawer } from "@web/src/features/wallet/components/AdminCreditDrawer";
import { useAdminOrgAccounts } from "@web/src/features/wallet/hooks/useAdminOrgAccounts";
import { useTreasuryBalance } from "@web/src/features/wallet/hooks/useTreasuryBalance";
import { Alert, Button, Card, Col, Row, Select, Statistic, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinancialManagementPage: React.FC = () => {
    const [selectedOrgId, setSelectedOrgId] = useState<string>();
    const [creditDrawerOpen, setCreditDrawerOpen] = useState(false);

    const { data: treasury, isLoading: isLoadingTreasury } = useTreasuryBalance();
    const { data: orgs, isLoading: isLoadingOrgs } = useAdminOrganizations();
    const { data: orgAccountsData, isLoading: isLoadingAccounts } =
        useAdminOrgAccounts(selectedOrgId);

    const lowTreasury = treasury && treasury.balanceCents < 1_000_000_00; // alert below $1M

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
                                message="Treasury balance is below $1,000,000 — top up required"
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
            {selectedOrgId && (
                <Card
                    title="Organization Accounts"
                    extra={
                        <Button
                            type="primary"
                            onClick={() => setCreditDrawerOpen(true)}
                            disabled={!orgAccountsData?.accounts?.length}
                        >
                            Credit Account
                        </Button>
                    }
                    loading={isLoadingAccounts}
                >
                    <Row gutter={16}>
                        {orgAccountsData?.accounts?.map((acc) => (
                            <Col span={6} key={acc.id}>
                                <Card size="small" bordered>
                                    <Statistic
                                        title={acc.name}
                                        value={(acc.balanceCents / 100).toFixed(2)}
                                        prefix={
                                            acc.currencyId.includes("usd")
                                                ? "$"
                                                : acc.currencyId.includes("cad")
                                                  ? "CA$"
                                                  : acc.currencyId.includes("cny")
                                                    ? "¥"
                                                    : "E$"
                                        }
                                        suffix={acc.currencyId.split("_")[1].toUpperCase()}
                                    />
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {acc.isActive ? "Active" : "Inactive"}
                                    </Text>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {orgAccountsData?.accounts?.length === 0 && !isLoadingAccounts && (
                        <Alert
                            type="info"
                            message="This organization has no financial accounts provisioned. Please run the backfill script."
                            showIcon
                        />
                    )}
                </Card>
            )}

            <AdminCreditDrawer
                open={creditDrawerOpen}
                onClose={() => setCreditDrawerOpen(false)}
                organizationId={selectedOrgId}
                accounts={orgAccountsData?.accounts}
            />
        </div>
    );
};
