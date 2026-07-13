import { CheckCircleOutlined, GlobalOutlined, WalletOutlined } from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { ManageAccountDrawer } from "@web/src/features/finance/components/ManageAccountDrawer";
import { OrgAccountCardGrid } from "@web/src/features/finance/components/OrgAccountCardGrid";
import { useOrganization } from "@web/src/features/organization";
import { CreateAccountDrawer } from "@web/src/features/wallet/components/CreateAccountDrawer";
import type { FinancialAccountData } from "@web/src/features/wallet/components/FinancialAccountCard";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import { Button, Col, Flex, Row, Tag, Typography, theme } from "antd";
import type React from "react";
import { useMemo, useState } from "react";

const { Title } = Typography;

export const BillingAccountsPage: React.FC = () => {
    const { token } = theme.useToken();
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
    const accounts = useMemo(() => balanceData?.accounts ?? [], [balanceData?.accounts]);
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
        <PageShell>
            <PageHeader
                title="Billing Accounts"
                subtitle="Treasury management and currency activation for organizational billing."
                actions={
                    <Button type="primary" size="large" onClick={() => setIsCreateDrawerOpen(true)}>
                        Create Custom Account
                    </Button>
                }
            />

            <SummaryCardsRow
                loading={isLoadingBalance}
                items={[
                    {
                        key: "total",
                        label: "Total Accounts",
                        value: accounts.length,
                        icon: <WalletOutlined />,
                        color: token.colorPrimary,
                    },
                    {
                        key: "active",
                        label: "Active Accounts",
                        value: accounts.filter((a) => a.isActive).length,
                        icon: <CheckCircleOutlined />,
                        color: token.colorSuccess,
                    },
                    {
                        key: "currencies",
                        label: "Currencies In Use",
                        value: currencyCount,
                        icon: <GlobalOutlined />,
                        color: token.colorInfo,
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
                    <Flex align="center" gap={12} className="mb-4">
                        <Title level={4} style={{ margin: 0 }}>
                            Accounts
                        </Title>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                            {filteredAccounts.length}
                        </Tag>
                    </Flex>
                    <OrgAccountCardGrid
                        accounts={filteredAccounts}
                        loading={isLoadingBalance}
                        onAccountClick={handleAccountClick}
                        emptyAction={
                            <Button type="primary" onClick={() => setIsCreateDrawerOpen(true)}>
                                Create custom account
                            </Button>
                        }
                    />
                </Col>
            </Row>

            <ManageAccountDrawer
                open={isManageDrawerOpen}
                onClose={() => setIsManageDrawerOpen(false)}
                account={selectedAccount}
                orgId={orgId}
                orgName={activeOrganization?.name}
                logoUrl={activeOrganization?.logo}
                size="default"
            />
            <CreateAccountDrawer
                open={isCreateDrawerOpen}
                onClose={() => setIsCreateDrawerOpen(false)}
                orgId={orgId}
            />
        </PageShell>
    );
};
