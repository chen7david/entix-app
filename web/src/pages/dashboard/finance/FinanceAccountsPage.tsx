import {
    CheckCircleOutlined,
    DownOutlined,
    GlobalOutlined,
    UpOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { CurrencyActivationGrid } from "@web/src/features/finance/components/CurrencyActivationGrid";
import { ManageAccountDrawer } from "@web/src/features/finance/components/ManageAccountDrawer";
import { OrgAccountCardGrid } from "@web/src/features/finance/components/OrgAccountCardGrid";
import { useActivateCurrency } from "@web/src/features/finance/hooks/useActivateCurrency";
import { useOrgCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { useOrganization } from "@web/src/features/organization";
import { CreateAccountDrawer } from "@web/src/features/wallet/components/CreateAccountDrawer";
import type { FinancialAccountData } from "@web/src/features/wallet/components/FinancialAccountCard";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import { Button, Card, Col, Flex, Grid, Row, Tag, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinanceAccountsPage: React.FC = () => {
    const screens = Grid.useBreakpoint();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);
    const [isCurrencyManagementOpen, setIsCurrencyManagementOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<WalletAccountDTO | null>(null);

    // RESTORED: Currency activation hooks and logic
    const { data: currenciesData, isLoading: isLoadingCurrencies } = useOrgCurrencies(orgId);
    const { mutate: activate, isPending: isActivating } = useActivateCurrency(orgId);

    // Fetch ALL active accounts for the org
    const { data: balanceData, isLoading: isLoadingBalance } = useWalletBalance(orgId, "org");
    const accounts = balanceData?.accounts ?? [];

    const handleAccountClick = (account: FinancialAccountData) => {
        setSelectedAccount(account as WalletAccountDTO);
        setIsManageDrawerOpen(true);
    };

    return (
        <div>
            <Flex
                vertical={!screens.md}
                justify="space-between"
                align={screens.md ? "center" : "start"}
                gap={16}
                style={{ marginBottom: 32 }}
            >
                <div style={{ flex: 1 }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Finance — Accounts
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Centralized treasury management. Manage organizational accounts, track
                        balances, and activate global currencies.
                    </Text>
                </div>
                <Button
                    type="primary"
                    size="large"
                    onClick={() => setIsCreateDrawerOpen(true)}
                    style={{ height: 44, fontWeight: 600 }}
                >
                    Create Custom Account
                </Button>
            </Flex>

            <SummaryCardsRow
                loading={isLoadingBalance || isLoadingCurrencies}
                items={[
                    {
                        key: "total",
                        label: "Total Accounts",
                        value: accounts.length,
                        icon: <WalletOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "active",
                        label: "Active Accounts",
                        value:
                            accounts.filter((a: any) => a.status === "active").length ||
                            accounts.length,
                        icon: <CheckCircleOutlined />,
                        color: "#10b981",
                    },
                    {
                        key: "currencies",
                        label: "Currencies In Use",
                        value: currenciesData?.filter((c) => c.isActivated).length || 0,
                        icon: <GlobalOutlined />,
                        color: "#8b5cf6",
                    },
                ]}
            />

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            Active Treasury Accounts
                        </Title>
                        <Tag
                            color="blue"
                            variant="filled"
                            style={{ borderRadius: 6, fontWeight: 600 }}
                        >
                            {accounts.length}
                        </Tag>
                    </Flex>
                    <OrgAccountCardGrid
                        accounts={accounts}
                        loading={isLoadingBalance}
                        onAccountClick={handleAccountClick}
                    />
                </Col>

                {/* Skeletons are now handled within OrgAccountCardGrid and CurrencyActivationGrid */}

                <Col span={24}>
                    <Card
                        style={{
                            marginTop: 8,
                            borderRadius: 12,
                            border: `1px solid var(--ant-color-border-secondary)`,
                        }}
                        styles={{ body: { padding: isCurrencyManagementOpen ? 24 : 16 } }}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ cursor: "pointer" }}
                            onClick={() => setIsCurrencyManagementOpen(!isCurrencyManagementOpen)}
                        >
                            <div>
                                <Text strong style={{ fontSize: 16 }}>
                                    Currency Management
                                </Text>
                                <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                                    {currenciesData?.filter((c) => c.isActivated).length || 0}{" "}
                                    active •{" "}
                                    {currenciesData?.filter((c) => !c.isActivated).length || 0}{" "}
                                    available
                                </Text>
                            </div>
                            <Button
                                type="text"
                                size="small"
                                icon={isCurrencyManagementOpen ? <UpOutlined /> : <DownOutlined />}
                            >
                                {isCurrencyManagementOpen ? "Hide" : "Show"}
                            </Button>
                        </Flex>

                        {/* Collapsible Content */}
                        {isCurrencyManagementOpen && (
                            <div style={{ marginTop: 24 }}>
                                <Text
                                    strong
                                    type="secondary"
                                    style={{
                                        fontSize: 11,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        display: "block",
                                        marginBottom: 16,
                                    }}
                                >
                                    Supported Currencies
                                </Text>
                                <CurrencyActivationGrid
                                    currencies={currenciesData ?? []}
                                    onAccountClick={handleAccountClick}
                                    onActivate={activate}
                                    activating={isActivating || isLoadingCurrencies}
                                />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            <ManageAccountDrawer
                open={isManageDrawerOpen}
                onClose={() => setIsManageDrawerOpen(false)}
                account={selectedAccount}
                orgId={orgId}
                size="default"
            />
            <CreateAccountDrawer
                open={isCreateDrawerOpen}
                onClose={() => setIsCreateDrawerOpen(false)}
                orgId={orgId}
            />
        </div>
    );
};
