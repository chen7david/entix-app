import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { CurrencyActivationGrid } from "@web/src/features/finance/components/CurrencyActivationGrid";
import { OrgAccountCardGrid } from "@web/src/features/finance/components/OrgAccountCardGrid";
import { useActivateCurrency } from "@web/src/features/finance/hooks/useActivateCurrency";
import { useOrgCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { useOrganization } from "@web/src/features/organization";
import { CreateAccountDrawer } from "@web/src/features/wallet/components/CreateAccountDrawer";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";

import { Button, Card, Col, Divider, Row, Tag, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinanceAccountsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    const { data: currenciesData, isLoading: isLoadingCurrencies } = useOrgCurrencies(orgId);
    const { mutate: activate, isPending: isActivating } = useActivateCurrency(orgId);

    // Fetch ALL active accounts for the org
    const { data: balanceData, isLoading: isLoadingBalance } = useWalletBalance(orgId, "org");

    const activated = currenciesData?.currencies.filter((c) => c.isActivated) ?? [];
    const available = currenciesData?.currencies.filter((c) => !c.isActivated) ?? [];

    return (
        <>
            <Toolbar />
            <div style={{ padding: 24 }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Col>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Finance — Accounts
                        </Title>
                        <Text type="secondary">
                            Centralized treasury management. Manage organizational accounts, track
                            balances, and activate global currencies.
                        </Text>
                    </Col>
                    <Col>
                        <Button type="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                            Create Custom Account
                        </Button>
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <div className="flex items-center gap-3 mb-4">
                            <Title level={4} style={{ margin: 0 }}>
                                Active Treasury Accounts
                            </Title>
                            <Tag color="blue" bordered={false}>
                                {balanceData?.accounts.length || 0}
                            </Tag>
                        </div>
                        <OrgAccountCardGrid
                            accounts={balanceData?.accounts || []}
                            loading={isLoadingBalance}
                            onCreditClick={() => {}}
                        />
                    </Col>

                    <Col span={24}>
                        <Divider style={{ margin: "24px 0" }}>Currency Management</Divider>
                        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                            Enable additional platform currencies. Activating a currency
                            automatically provisions a dedicated General Fund account.
                        </Text>

                        {activated.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Text
                                    strong
                                    type="secondary"
                                    style={{
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                        display: "block",
                                        marginBottom: 8,
                                    }}
                                >
                                    Activated
                                </Text>
                                <CurrencyActivationGrid
                                    currencies={activated}
                                    onActivate={activate}
                                    activating={isActivating}
                                />
                            </div>
                        )}

                        {available.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Text
                                    strong
                                    type="secondary"
                                    style={{
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                        display: "block",
                                        marginBottom: 8,
                                    }}
                                >
                                    Available for Activation
                                </Text>
                                <CurrencyActivationGrid
                                    currencies={available}
                                    onActivate={activate}
                                    activating={isActivating}
                                />
                            </div>
                        )}
                    </Col>

                    {(isLoadingCurrencies || isLoadingBalance) && !balanceData?.accounts.length && (
                        <Col span={24}>
                            <Card loading />
                        </Col>
                    )}
                </Row>

                <CreateAccountDrawer
                    open={isCreateDrawerOpen}
                    onClose={() => setIsCreateDrawerOpen(false)}
                    orgId={orgId}
                />
            </div>
        </>
    );
};
