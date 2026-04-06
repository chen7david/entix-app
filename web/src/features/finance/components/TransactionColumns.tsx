import { ArrowRightOutlined, CopyOutlined } from "@ant-design/icons";
import { Badge, Space, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";

const { Text } = Typography;

export type TransactionRecord = {
    id: string;
    amountCents: number;
    status: "pending" | "completed" | "reversed";
    description: string | null;
    transactionDate: string;
    categoryId: string;
    currencyId: string;
    sourceAccount: { name: string };
    destinationAccount: { name: string };
    category: { name: string };
    currency: { symbol: string; code: string };
};

export const getTransactionColumns = (notification: any): ColumnsType<TransactionRecord> => [
    {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 140,
        render: (id) => (
            <Tooltip title="Click to copy full ID">
                <Text
                    className="font-mono text-[10px] opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
                    onClick={() => {
                        navigator.clipboard.writeText(id);
                        notification.success({
                            message: "Copied",
                            description: "Transaction ID copied to clipboard",
                        });
                    }}
                >
                    {id.slice(0, 8)}...
                    <CopyOutlined className="ml-1 text-[8px]" />
                </Text>
            </Tooltip>
        ),
    },
    {
        title: "Date",
        dataIndex: "transactionDate",
        key: "date",
        width: 160,
        sorter: (a, b) =>
            new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
        render: (date) => (
            <div className="flex flex-col">
                <Text className="text-xs font-medium">
                    {format(new Date(date), "MMM dd, yyyy")}
                </Text>
                <Text type="secondary" className="text-[10px] uppercase tracking-tight">
                    {format(new Date(date), "HH:mm:ss")}
                </Text>
            </div>
        ),
    },
    {
        title: "Category",
        dataIndex: ["category", "name"],
        key: "category",
        width: 140,
        render: (name, record) => (
            <Tag
                color={record.categoryId.includes("refund") ? "orange" : "blue"}
                variant="filled"
                className="rounded-full px-3 text-[10px] font-semibold border-none"
            >
                {name ?? "General"}
            </Tag>
        ),
    },
    {
        title: "Flow",
        key: "flow",
        width: 300,
        render: (_, record) => (
            <Space className="max-w-[280px]">
                <Text
                    strong
                    className="truncate text-[11px] block max-w-[110px]"
                    title={record.sourceAccount?.name}
                >
                    {record.sourceAccount?.name}
                </Text>
                <ArrowRightOutlined className="text-zinc-300 scale-75" />
                <Text
                    strong
                    className="truncate text-[11px] block max-w-[110px]"
                    title={record.destinationAccount?.name}
                >
                    {record.destinationAccount?.name}
                </Text>
            </Space>
        ),
    },
    {
        title: "Amount",
        dataIndex: "amountCents",
        key: "amount",
        align: "right",
        width: 130,
        render: (amount, record) => (
            <div className="flex flex-col items-end">
                <Text strong className="text-sm tabular-nums tracking-tight">
                    {record.currency?.symbol ?? ""}
                    {(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text type="secondary" className="text-[9px] uppercase font-bold tracking-widest">
                    {record.currencyId}
                </Text>
            </div>
        ),
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (status) => {
            const config = {
                completed: { color: "success", label: "Completed" },
                pending: { color: "warning", label: "Pending" },
                reversed: { color: "error", label: "Reversed" },
            };
            const { color, label } = config[status as keyof typeof config] || {
                color: "default",
                label: status,
            };
            return (
                <Badge
                    status={color as any}
                    text={<Text className="text-[10px] font-bold uppercase">{label}</Text>}
                />
            );
        },
    },
];
