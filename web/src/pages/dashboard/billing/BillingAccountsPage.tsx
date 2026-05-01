import { CheckCircleOutlined, GlobalOutlined, WalletOutlined } from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { ManageAccountDrawer } from "@web/src/features/finance/components/ManageAccountDrawer";
import { OrgAccountCardGrid } from "@web/src/features/finance/components/OrgAccountCardGrid";
import { useOrganization } from "@web/src/features/organization";
import { CreateAccountDrawer } from "@web/src/features/wallet/components/CreateAccountDrawer";
import type { FinancialAccountData } from "@web/src/features/wallet/components/FinancialAccountCard";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import { Button, Col, Flex, Row, Tag, Typography } from "antd";
import type React from "react";
import { useMemo, useState } from "react";

const { Title } = Typography;

export const BillingAccountsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<WalletAccountDTO | null>(null);
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        accountType: "all",
    });

    const { data: balanceData, isLoading: isLoadingBalance } = useWalletBalance(orgId, "org");
    const accounts = balanceData?.accounts ?? [];
    const currencyCount = useMemo(
        () => new Set(accounts.map((account) => account.currencyId)).size,
        [accounts]
    );

    const filterConfig: FilterConfig[] = [
        {
            type: "search",
            key: "search",
            placeholder: "Search accounts...",
            minWidth: 220,
        },
        {
            type: "select",
            key: "status",
            placeholder: "All Statuses",
            allowClear: false,
            minWidth: 170,
            options: [
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
            ],
        },
        {
            type: "select",
            key: "accountType",
            placeholder: "All Account Types",
            allowClear: false,
            minWidth: 200,
            options: [
                { label: "All Account Types", value: "all" },
                { label: "Funding", value: "funding" },
                { label: "Treasury", value: "treasury" },
                { label: "Savings", value: "savings" },
                { label: "System", value: "system" },
            ],
        },
    ];

    const filteredAccounts = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return accounts.filter((account) => {
            const matchesSearch =
                q.length === 0 ||
                account.name.toLowerCase().includes(q) ||
                account.currencyId.toLowerCase().includes(q) ||
                account.id.toLowerCase().includes(q);

            const matchesStatus =
                filters.status === "all" ||
                (filters.status === "active" ? account.isActive : !account.isActive);

            const matchesType =
                filters.accountType === "all" || account.accountType === filters.accountType;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [accounts, filters.accountType, filters.search, filters.status]);

    const handleAccountClick = (account: FinancialAccountData) => {
        setSelectedAccount(account as WalletAccountDTO);
        setIsManageDrawerOpen(true);
    };

    return (
        <div>
            <PageHeader
                title="Billing Accounts"
                subtitle="Centralized treasury management and currency activation for organizational billing."
                actions={
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => setIsCreateDrawerOpen(true)}
                        className="h-11 font-semibold"
                    >
                        Create Custom Account
                    </Button>
                }
            />

            <div className="flex flex-col gap-8">
                <SummaryCardsRow
                    loading={isLoadingBalance}
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
                            value: currencyCount,
                            icon: <GlobalOutlined />,
                            color: "#8b5cf6",
                        },
                    ]}
                />

                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <FilterBar
                            filters={filterConfig}
                            values={filters}
                            initialValues={{ search: "", status: "all", accountType: "all" }}
                            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
                            onReset={() =>
                                setFilters({
                                    search: "",
                                    status: "all",
                                    accountType: "all",
                                })
                            }
                        />
                        <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                            <Title level={4} style={{ margin: 0 }}>
                                Active Treasury Accounts
                            </Title>
                            <Tag
                                color="blue"
                                variant="filled"
                                style={{ borderRadius: 6, fontWeight: 600 }}
                            >
                                {filteredAccounts.length}
                            </Tag>
                        </Flex>
                        <OrgAccountCardGrid
                            accounts={filteredAccounts}
                            loading={isLoadingBalance}
                            onAccountClick={handleAccountClick}
                        />
                    </Col>
                </Row>
            </div>

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
