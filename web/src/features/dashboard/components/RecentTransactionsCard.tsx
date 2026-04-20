import { HistoryOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { TransactionAmount } from "@web/src/components/ui/TransactionAmount";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { List, Tooltip, Typography } from "antd";
import type React from "react";
import { DashboardCard } from "./DashboardCard";

const { Text } = Typography;

export const RecentTransactionsCard: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();
    const { data: transactions, isLoading } = useTransactions(activeOrganization?.id, {
        limit: 5,
    });

    return (
        <DashboardCard
            titleText="Recent Transactions"
            icon={<HistoryOutlined className="text-emerald-500" />}
            onViewAll={() => navigateOrg(AppRoutes.org.admin.billing.transactions)}
        >
            <List
                loading={isLoading}
                dataSource={transactions?.items || []}
                renderItem={(item) => {
                    const isRevenue = item.category.isRevenue;
                    const isExpense = item.category.isExpense;
                    return (
                        <List.Item
                            className="px-0 py-3"
                            extra={
                                <div className="text-right flex flex-col items-end">
                                    <TransactionAmount
                                        amountCents={item.amountCents}
                                        currencySymbol={item.currency.symbol}
                                        currencyCode={item.currency.code}
                                        isRevenue={isRevenue}
                                        isExpense={isExpense}
                                    />
                                    <Text
                                        type="secondary"
                                        className="text-[11px] lowercase tracking-tight"
                                    >
                                        {DateUtils.fromNow(item.transactionDate).toLowerCase()}
                                    </Text>
                                </div>
                            }
                        >
                            <List.Item.Meta
                                title={
                                    <Tooltip
                                        title={item.description || "Transaction"}
                                        mouseEnterDelay={0.5}
                                    >
                                        <Text
                                            strong
                                            className="text-sm block truncate max-w-[180px]"
                                        >
                                            {item.description || "Transaction"}
                                        </Text>
                                    </Tooltip>
                                }
                                description={
                                    <Text type="secondary" className="text-xs">
                                        {item.category.name}
                                    </Text>
                                }
                            />
                        </List.Item>
                    );
                }}
                locale={{
                    emptyText: (
                        <Text type="secondary" italic>
                            No recent transactions
                        </Text>
                    ),
                }}
            />
        </DashboardCard>
    );
};
