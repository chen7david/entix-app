import {
    CheckCircleOutlined,
    InteractionOutlined,
    RollbackOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import type { FilterConfig } from "@web/src/components/data/DataTableWithFilters";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useReverseTransaction } from "@web/src/features/finance/hooks/useReverseTransaction";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization } from "@web/src/features/organization";
import { Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const BillingTransactionsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // Cursor stack: navigate forward/back by pushing/popping cursors
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const currentCursor = cursorStack[cursorStack.length - 1];

    const { data, isLoading } = useTransactions(orgId, {
        cursor: currentCursor,
        limit: pageSize,
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
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Transaction Ledger
                </Title>
                <Text type="secondary" className="text-base">
                    A comprehensive, immutable record of all organizational billing transactions and
                    reversals.
                </Text>
            </div>

            <SummaryCardsRow
                loading={isLoading}
                items={[
                    {
                        key: "total",
                        label: "Ledger Records",
                        value: data?.items?.length || 0,
                        icon: <InteractionOutlined />,
                        color: "#2563eb",
                    },
                    {
                        key: "completed",
                        label: "Completed",
                        value: data?.items?.filter((t) => t.status === "completed").length || 0,
                        icon: <CheckCircleOutlined />,
                        color: "#10b981",
                    },
                    {
                        key: "pending",
                        label: "Pending",
                        value: data?.items?.filter((t) => t.status === "pending").length || 0,
                        icon: <SyncOutlined />,
                        color: "#f59e0b",
                    },
                    {
                        key: "reversed",
                        label: "Reversed",
                        value: data?.items?.filter((t) => t.status === "reversed").length || 0,
                        icon: <RollbackOutlined />,
                        color: "#ef4444",
                    },
                ]}
            />

            <TransactionLedgerTable
                transactions={data?.items || []}
                loading={isLoading}
                onReverse={(txId, reason) => reverse({ txId, reason })}
                isReversing={isReversing ? variables?.txId : null}
                pagination={{
                    pageSize,
                    hasNextPage: !!data?.nextCursor,
                    hasPrevPage: cursorStack.length > 0,
                    onNext: handleNext,
                    onPrev: handlePrev,
                    onPageSizeChange: (size: number) => {
                        setPageSize(size);
                        setCursorStack([]); // Reset on size change
                    },
                }}
                filters={filterConfig}
                onFiltersChange={handleFiltersChange}
            />
        </div>
    );
};
