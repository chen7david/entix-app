import { Table, Tag, Tooltip, theme } from "antd";
import type { Transaction } from "../hooks/useTransactionHistory";

type TransactionTableProps = {
    transactions?: Transaction[];
    loading?: boolean;
    page: number;
    pageSize: number;
    total?: number;
    onPageChange: (page: number, pageSize: number) => void;
};

export const TransactionTable = ({
    transactions,
    loading,
    page,
    pageSize,
    onPageChange,
}: TransactionTableProps) => {
    const { token } = theme.useToken();
    const columns = [
        {
            title: "Date",
            dataIndex: "transactionDate",
            key: "date",
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: "Category",
            dataIndex: ["category", "name"],
            key: "category",
        },
        {
            title: "Source",
            dataIndex: ["sourceAccount", "name"],
            key: "source",
        },
        {
            title: "Destination",
            dataIndex: ["destinationAccount", "name"],
            key: "destination",
        },
        {
            title: "Amount",
            key: "amount",
            render: (_: unknown, record: Transaction) => (
                <span style={{ fontWeight: "bold" }}>
                    {record.currency?.symbol}
                    {(record.amountCents / 100).toFixed(2)} {record.currency?.code}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                let color = "blue";
                if (status === "completed") color = "green";
                if (status === "reversed") color = "red";
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (desc: string) => (
                <Tooltip title={desc}>
                    <span
                        style={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "inline-block",
                        }}
                    >
                        {desc || "-"}
                    </span>
                </Tooltip>
            ),
        },
    ];

    return (
        <div style={{ background: token.colorBgContainer, borderRadius: token.borderRadiusLG }}>
            <Table
                dataSource={transactions}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    onChange: onPageChange,
                    total: transactions?.length || 0,
                }}
            />
        </div>
    );
};
