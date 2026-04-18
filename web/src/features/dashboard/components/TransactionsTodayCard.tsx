import { BankOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Spin, Typography } from "antd";
import type React from "react";
import { useMemo } from "react";
import { DashboardCard } from "./DashboardCard";

const { Text, Title } = Typography;

export const TransactionsTodayCard: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();

    // startOf/endOf return epoch ms — convert to ISO strings for the API filter
    const range = useMemo(
        () => ({
            startDate: new Date(DateUtils.startOf("day")).toISOString(),
            endDate: new Date(DateUtils.endOf("day")).toISOString(),
        }),
        []
    );

    const { data: transactions, isLoading } = useTransactions(activeOrganization?.id, {
        limit: 1000,
        startDate: range.startDate,
        endDate: range.endDate,
    });

    const txCount = transactions?.items?.length ?? 0;

    return (
        <DashboardCard
            titleText="Transactions Today"
            icon={<BankOutlined className="text-emerald-500" />}
            onViewAll={() => navigateOrg(AppRoutes.org.admin.billing.transactions)}
        >
            <div className="flex flex-col items-center justify-center py-8 h-[240px]">
                {isLoading ? (
                    <Spin />
                ) : (
                    <>
                        <Title level={1} style={{ fontSize: "72px", margin: 0, color: "#10b981" }}>
                            {txCount}
                        </Title>
                        <Text type="secondary" className="mt-2 text-base">
                            Processed since midnight
                        </Text>
                    </>
                )}
            </div>
        </DashboardCard>
    );
};
