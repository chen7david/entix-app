import { Empty, Table, Tag, Tooltip, Typography, theme } from "antd";

const { Text } = Typography;

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
    total,
    onPageChange,
}: TransactionTableProps) => {
    const { token } = theme.useToken();
    const columns = [
        {
            title: "Date",
            dataIndex: "transactionDate",
            key: "date",
            width: 180,
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: "Category",
            dataIndex: ["category", "name"],
            key: "category",
            width: 140,
            render: (name: string) => <Tag color="blue">{name || "General"}</Tag>,
        },
        {
            title: "Source",
            dataIndex: ["sourceAccount", "name"],
            key: "source",
            width: 180,
            ellipsis: true,
        },
        {
            title: "Destination",
            dataIndex: ["destinationAccount", "name"],
            key: "destination",
            width: 180,
            ellipsis: true,
        },
        {
            title: "Amount",
            key: "amount",
            width: 150,
            align: "right" as const,
            render: (_: unknown, record: Transaction) => (
                <Text strong>
                    {record.currency?.symbol}
                    {(record.amountCents / 100).toFixed(2)} {record.currency?.code}
                </Text>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
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
            width: 250,
            ellipsis: true,
            render: (desc: string) => (
                <Tooltip title={desc}>
                    <Text type="secondary" ellipsis>
                        {desc || "-"}
                    </Text>
                </Tooltip>
            ),
        },
    ];

    return (
        <div
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
                overflow: "hidden",
            }}
        >
            <Table
                dataSource={transactions}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: "max-content" }}
                tableLayout="fixed"
                size="middle"
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No transactions found."
                        />
                    ),
                }}
                pagination={{
                    current: page,
                    pageSize: pageSize,
                    onChange: onPageChange,
                    total: total || transactions?.length || 0,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} transactions`,
                }}
            />
        </div>
    );
};
