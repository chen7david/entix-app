import {
    BankOutlined,
    DollarOutlined,
    RightOutlined,
    TeamOutlined,
    TransactionOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import { MemberSetupIssuesPanel, RecentTransactionsCard } from "@web/src/features/dashboard";
import { useBillingPlans } from "@web/src/features/finance/hooks/useBillingPlans";
import { useBulkMembers, useOrganization } from "@web/src/features/organization";
import { useOrgNavigate } from "@web/src/features/organization/hooks/useOrgNavigate";
import { Alert, Button, Card, Col, Row, Space, Typography, theme } from "antd";
import type React from "react";

const { Text } = Typography;

export const FinancePortal: React.FC = () => {
    const { token } = theme.useToken();
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();
    const { metrics, isLoadingMetrics } = useBulkMembers(activeOrganization?.id);
    const { data: billingPlansResult, isLoading: isBillingPlansLoading } = useBillingPlans(
        activeOrganization?.id ?? "",
        { limit: 50 }
    );
    const hasActiveBillingPlan = (billingPlansResult?.data ?? []).some((plan) => plan.isActive);
    const readiness = metrics?.paymentReadiness;

    return (
        <PageShell fill={false}>
            <PageHeader
                eyebrow="Finance"
                title="Money & billing"
                subtitle={`Manage member wallets, ledger activity, and billing plans for ${activeOrganization?.name}.`}
            />

            {!isBillingPlansLoading && !hasActiveBillingPlan && (
                <Alert
                    type="warning"
                    showIcon
                    className="mb-6"
                    message="No active billing plan"
                    description={
                        <>
                            Students cannot be billed until a plan is active.{" "}
                            <Button
                                type="link"
                                className="!p-0 h-auto align-baseline"
                                onClick={() => navigateOrg(AppRoutes.org.admin.billing.plans)}
                            >
                                Create a billing plan
                            </Button>
                        </>
                    }
                />
            )}

            <Row gutter={[16, 16]} className="mb-6">
                {[
                    {
                        label: "Members",
                        desc: "Wallets & billing assignments",
                        icon: <TeamOutlined />,
                        path: AppRoutes.org.admin.members,
                    },
                    {
                        label: "Transactions",
                        desc: "Org ledger history",
                        icon: <TransactionOutlined />,
                        path: AppRoutes.org.admin.billing.transactions,
                    },
                    {
                        label: "Accounts",
                        desc: "Funding & org accounts",
                        icon: <BankOutlined />,
                        path: AppRoutes.org.admin.billing.accounts,
                    },
                    {
                        label: "Plans",
                        desc: "Session billing rates",
                        icon: <DollarOutlined />,
                        path: AppRoutes.org.admin.billing.plans,
                    },
                ].map((item) => (
                    <Col xs={24} sm={12} lg={6} key={item.path}>
                        <Card
                            hoverable
                            className="h-full border-0 shadow-sm"
                            onClick={() => navigateOrg(item.path)}
                        >
                            <Space align="start">
                                <span style={{ fontSize: 24, color: token.colorPrimary }}>
                                    {item.icon}
                                </span>
                                <div>
                                    <Text strong>{item.label}</Text>
                                    <div>
                                        <Text type="secondary" className="text-xs">
                                            {item.desc}
                                        </Text>
                                    </div>
                                </div>
                            </Space>
                            <Button type="link" className="!px-0 mt-2" icon={<RightOutlined />}>
                                Open
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={14}>
                    <MemberSetupIssuesPanel
                        paymentReadiness={isLoadingMetrics ? undefined : readiness}
                    />
                </Col>
                <Col xs={24} lg={10}>
                    <RecentTransactionsCard />
                </Col>
            </Row>
        </PageShell>
    );
};
