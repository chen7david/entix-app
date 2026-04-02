import { ArrowRightOutlined, HistoryOutlined, RollbackOutlined } from "@ant-design/icons";
import { Badge, Button, Input, Modal, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";
import type React from "react";
import { useState } from "react";
import type { TransactionRecord } from "../hooks/useTransactions";

const { Text } = Typography;

type Props = {
    transactions: TransactionRecord[];
    loading?: boolean;
    onReverse: (txId: string, reason: string) => void;
    isReversing?: string | null;
    pagination: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
    };
};

export const TransactionLedgerTable: React.FC<Props> = ({
    transactions,
    loading,
    onReverse,
    isReversing,
    pagination,
}) => {
    const [reversalModal, setReversalModal] = useState<{ id: string } | null>(null);
    const [reason, setReason] = useState("");

    const columns: ColumnsType<TransactionRecord> = [
        {
            title: "Transaction ID",
            dataIndex: "id",
            key: "id",
            width: 140,
            render: (id) => (
                <Tooltip title={id}>
                    <Text copyable={{ text: id }} className="font-mono text-xs opacity-70">
                        {id.slice(0, 8)}...
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: "Date",
            dataIndex: "transactionDate",
            key: "date",
            width: 160,
            sorter: true,
            render: (date) => (
                <div className="flex flex-col">
                    <Text className="text-sm">{format(new Date(date), "MMM dd, yyyy")}</Text>
                    <Text type="secondary" className="text-[10px] uppercase">
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
                    className="rounded-full px-3"
                >
                    {name}
                </Tag>
            ),
        },
        {
            title: "Source → Destination",
            key: "flow",
            width: 320,
            render: (_, record) => (
                <div className="flex items-center gap-2 max-w-[300px]">
                    <div className="flex flex-col min-w-0">
                        <Text strong className="truncate text-xs" title={record.sourceAccount.name}>
                            {record.sourceAccount.name}
                        </Text>
                    </div>
                    <ArrowRightOutlined className="text-zinc-300 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <Text
                            strong
                            className="truncate text-xs"
                            title={record.destinationAccount.name}
                        >
                            {record.destinationAccount.name}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Amount",
            dataIndex: "amountCents",
            key: "amount",
            align: "right",
            width: 150,
            render: (amount, record) => (
                <div className="flex flex-col items-end">
                    <Text strong className="text-base tabular-nums">
                        {record.currency.symbol}
                        {(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                    <Text
                        type="secondary"
                        className="text-[10px] uppercase font-medium tracking-tighter"
                    >
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
                    completed: { color: "green", label: "Completed" },
                    pending: { color: "gold", label: "Pending" },
                    reversed: { color: "red", label: "Reversed" },
                };
                const { color, label } = config[status as keyof typeof config] || {
                    color: "default",
                    label: status,
                };
                return <Badge color={color} text={label} className="text-xs font-medium" />;
            },
        },
        {
            title: "Actions",
            key: "actions",
            width: 80,
            fixed: "right",
            render: (_, record) => (
                <Tooltip
                    title={record.status === "reversed" ? "Already Reversed" : "Request Reversal"}
                >
                    <Button
                        type="text"
                        danger
                        icon={<RollbackOutlined />}
                        disabled={record.status === "reversed"}
                        loading={isReversing === record.id}
                        onClick={() => setReversalModal({ id: record.id })}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <>
            <Table
                columns={columns}
                dataSource={transactions}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    pageSizeOptions: ["20", "40", "60", "100"],
                }}
                scroll={{ x: "max-content" }}
            />

            <Modal
                title={
                    <Space>
                        <HistoryOutlined style={{ color: "var(--ant-color-error)" }} />
                        <span>Reverse Transaction</span>
                    </Space>
                }
                open={!!reversalModal}
                onOk={() => {
                    if (reversalModal && reason.trim()) {
                        onReverse(reversalModal.id, reason);
                        setReversalModal(null);
                        setReason("");
                    }
                }}
                onCancel={() => setReversalModal(null)}
                okText="Execute Reversal"
                okButtonProps={{ danger: true, disabled: !reason.trim() }}
            >
                <div style={{ paddingTop: 16 }}>
                    <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                        Reversing a transaction will create a mirror rebuttal transaction in the
                        ledger. This action is irreversible and will be logged for auditing.
                    </Text>
                    <div style={{ marginBottom: 8 }}>
                        <Text
                            strong
                            type="secondary"
                            style={{ fontSize: 10, textTransform: "uppercase" }}
                        >
                            Reason for Reversal
                        </Text>
                    </div>
                    <Input.TextArea
                        id="reversal-reason"
                        rows={4}
                        placeholder="Provide a specific reason for this reversal (e.g., incorrect amount, duplicate entry)..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
            </Modal>
        </>
    );
};
