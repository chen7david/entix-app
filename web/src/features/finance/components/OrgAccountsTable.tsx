import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { Badge, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { WalletAccount } from "../../wallet/hooks/useWalletBalance";

const { Text } = Typography;

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
            width: 200,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Currency",
            dataIndex: "currencyId",
            key: "currency",
            width: 120,
            render: (currencyId) => {
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
            render: (cents, record) => {
                const config =
                    FINANCIAL_CURRENCY_CONFIG[
                        record.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                    ];
                const value = (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
                return (
                    <Text strong style={{ fontFamily: "monospace" }}>
                        <Text type="secondary" style={{ marginRight: 4 }}>
                            {config?.symbol || ""}
                        </Text>
                        {value}
                    </Text>
                );
            },
            align: "right",
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "status",
            width: 120,
            render: (isActive) => (
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
        <Table
            dataSource={accounts}
            rowKey="id"
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 12 }}
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
            size="middle"
        />
    );
};
