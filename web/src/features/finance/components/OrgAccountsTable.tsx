import { FINANCIAL_CURRENCY_CONFIG, type WalletAccountDTO } from "@shared";
import { DataTableWithFilters } from "@web/src/components/data/DataTableWithFilters";
import { Badge, Typography } from "antd";
import { useState } from "react";

const { Text } = Typography;

type OrgAccountsTableProps = {
    accounts?: WalletAccountDTO[];
    loading?: boolean;
};

export const OrgAccountsTable = ({ accounts, loading }: OrgAccountsTableProps) => {
    const [filters, setFilters] = useState<Record<string, any>>({});

    const filteredAccounts = (accounts || []).filter((account) => {
        const matchesSearch =
            !filters.search || account.name.toLowerCase().includes(filters.search.toLowerCase());

        const matchesStatus =
            filters.status === undefined ||
            filters.status === "all" ||
            (filters.status === "active" && account.isActive) ||
            (filters.status === "deactivated" && !account.isActive);

        return matchesSearch && matchesStatus;
    });

    const columns = [
        {
            title: "Account Name",
            dataIndex: "name",
            key: "name",
            width: 200,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: "Currency",
            dataIndex: "currencyId",
            key: "currency",
            width: 120,
            render: (currencyId: string) => {
                const config =
                    FINANCIAL_CURRENCY_CONFIG[currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];
                return config ? (
                    <Text>
                        {config.code}{" "}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            ({config.symbol})
                        </Text>
                    </Text>
                ) : (
                    currencyId
                );
            },
        },
        {
            title: "Balance",
            dataIndex: "balanceCents",
            key: "balance",
            width: 150,
            render: (cents: number, record: WalletAccountDTO) => {
                const config =
                    FINANCIAL_CURRENCY_CONFIG[
                        record.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                    ];
                const value = (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
                return (
                    <Text strong className="font-mono">
                        <Text type="secondary" style={{ marginRight: 4 }}>
                            {config?.symbol || ""}
                        </Text>
                        {value}
                    </Text>
                );
            },
            align: "right" as const,
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "status",
            width: 120,
            render: (isActive: boolean) => (
                <Badge
                    status={isActive ? "success" : "default"}
                    text={
                        <Text type={isActive ? undefined : "secondary"} style={{ fontSize: 13 }}>
                            {isActive ? "Active" : "Deactivated"}
                        </Text>
                    }
                />
            ),
        },
    ];

    return (
        <DataTableWithFilters
            config={{
                columns,
                data: filteredAccounts,
                rowKey: "id",
                loading,
                filters: [
                    {
                        type: "search",
                        key: "search",
                        placeholder: "Search account name...",
                    },
                    {
                        type: "select",
                        key: "status",
                        placeholder: "Filter by status",
                        options: [
                            { label: "All Statuses", value: "all" },
                            { label: "Active", value: "active" },
                            { label: "Deactivated", value: "deactivated" },
                        ],
                    },
                ],
                onFiltersChange: setFilters,
                pagination: {
                    pageSize: 12,
                },
            }}
        />
    );
};
