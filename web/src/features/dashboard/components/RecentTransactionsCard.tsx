import { AppRoutes } from "@shared";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization, useOrgNavigate } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { CurrencyUtils } from "@web/src/utils/number";
import { Button, Card, List, Typography } from "antd";
import type React from "react";

const { Text } = Typography;

export const RecentTransactionsCard: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();
    const { data: transactions, isLoading } = useTransactions(activeOrganization?.id, {
        limit: 5,
    });

    return (
        <Card
            title="Recent Transactions"
            className="shadow-sm h-full"
            extra={
                <Button
                    type="link"
                    size="small"
                    className="p-0 text-xs"
                    onClick={() => navigateOrg(AppRoutes.org.admin.billing.transactions)}
                >
                    View All
                </Button>
            }
        >
            <List
                loading={isLoading}
                dataSource={transactions?.items || []}
                renderItem={(item) => {
                    const isPositive = item.amountCents > 0;
                    return (
                        <List.Item
                            className="px-0 py-3"
                            extra={
                                <div className="text-right flex flex-col items-end">
                                    <Text
                                        strong
                                        className={
                                            isPositive ? "text-emerald-600" : "text-slate-800"
                                        }
                                        style={{ fontSize: "15px" }}
                                    >
                                        {CurrencyUtils.format(
                                            item.amountCents,
                                            item.currency.symbol
                                        )}
                                    </Text>
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
                                    <Text strong className="text-sm block truncate max-w-[180px]">
                                        {item.description || "Transaction"}
                                    </Text>
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
        </Card>
    );
};
