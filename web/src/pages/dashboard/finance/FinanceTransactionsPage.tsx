import type { FilterConfig } from "@web/src/components/data/DataTableWithFilters";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useReverseTransaction } from "@web/src/features/finance/hooks/useReverseTransaction";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization } from "@web/src/features/organization";
import { Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinanceTransactionsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // Cursor stack: navigate forward/back by pushing/popping cursors
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, any>>({});

    const currentCursor = cursorStack[cursorStack.length - 1];

    const { data, isLoading } = useTransactions(orgId, {
        cursor: currentCursor,
        limit: 20,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        txId: filters.txId || undefined,
    });

    const { mutate: reverse, isPending: isReversing, variables } = useReverseTransaction(orgId);

    const filterConfig: FilterConfig[] = [
        {
            type: "search",
            key: "txId",
            placeholder: "Transaction ID",
        },
        {
            type: "dateRange",
            key: "dateRange",
            keys: ["startDate", "endDate"],
        },
        {
            type: "select",
            key: "status",
            placeholder: "All Statuses",
            options: [
                { label: "Completed", value: "completed" },
                { label: "Reversed", value: "reversed" },
                { label: "Pending", value: "pending" },
            ],
        },
    ];

    const handleFiltersChange = (newFilters: Record<string, any>) => {
        setFilters(newFilters);
        setCursorStack([]); // Reset to first page on filter change
    };

    const handleNext = () => {
        if (data?.nextCursor) {
            setCursorStack((prev) => [...prev, data.nextCursor as string]);
        }
    };

    const handlePrev = () => {
        setCursorStack((prev) => prev.slice(0, -1));
    };

    return (
        <>
            <Toolbar />
            <div className="p-8">
                <div className="mb-8">
                    <Title level={2} style={{ marginBottom: 4 }}>
                        Financial Ledger
                    </Title>
                    <Text type="secondary" className="text-base">
                        A comprehensive, immutable record of all organizational financial
                        transactions and reversals.
                    </Text>
                </div>

                <TransactionLedgerTable
                    transactions={data?.items || []}
                    loading={isLoading}
                    onReverse={(txId, reason) => reverse({ txId, reason })}
                    isReversing={isReversing ? variables?.txId : null}
                    pagination={{
                        pageSize: 20,
                        hasNextPage: !!data?.nextCursor,
                        hasPrevPage: cursorStack.length > 0,
                        onNext: handleNext,
                        onPrev: handlePrev,
                    }}
                    filters={filterConfig}
                    onFiltersChange={handleFiltersChange}
                />
            </div>
        </>
    );
};
