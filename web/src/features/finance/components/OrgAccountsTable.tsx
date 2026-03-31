import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { Badge, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { WalletAccount } from "../../wallet/hooks/useWalletBalance";

type OrgAccountsTableProps = {
    accounts?: WalletAccount[];
    loading?: boolean;
};

export const OrgAccountsTable = ({ accounts, loading }: OrgAccountsTableProps) => {
    const columns: ColumnsType<WalletAccount> = [
        {
            title: "Account Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Currency",
            dataIndex: "currencyId",
            key: "currency",
            render: (currencyId) => {
                const config =
                    FINANCIAL_CURRENCY_CONFIG[currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG];
                return config ? (
                    <span>
                        {config.code} ({config.symbol})
                    </span>
                ) : (
                    currencyId
                );
            },
        },
        {
            title: "Balance",
            dataIndex: "balanceCents",
            key: "balance",
            render: (cents, record) => {
                const config =
                    FINANCIAL_CURRENCY_CONFIG[
                        record.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                    ];
                const value = (cents / 100).toFixed(2);
                return `${config?.symbol || ""}${value}`;
            },
            align: "right",
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "status",
            render: (isActive) => (
                <Badge
                    status={isActive ? "success" : "default"}
                    text={isActive ? "Active" : "Deactivated"}
                />
            ),
        },
    ];

    return (
        <Table
            dataSource={accounts}
            rowKey="id"
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 10 }}
        />
    );
};
