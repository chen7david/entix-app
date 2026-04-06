import { HistoryOutlined, RollbackOutlined } from "@ant-design/icons";
import type { CursorPaginationConfig } from "@web/src/components/data/DataTable.types";
import {
    DataTableWithFilters,
    type FilterConfig,
} from "@web/src/components/data/DataTableWithFilters";
import { Button, Input, Modal, Space, Typography } from "antd";
import type React from "react";
import { useState } from "react";
import { getTransactionColumns, type TransactionRecord } from "./TransactionColumns";

const { Text } = Typography;

type Props = {
    transactions: TransactionRecord[];
    loading?: boolean;
    onReverse?: (txId: string, reason: string) => void;
    onFiltersChange: (filters: Record<string, any>) => void;
    isReversing?: string | null;
    pagination: CursorPaginationConfig;
    filters: FilterConfig[];
};

export const TransactionLedgerTable: React.FC<Props> = ({
    transactions,
    loading,
    onReverse,
    onFiltersChange,
    isReversing,
    pagination,
    filters,
}) => {
    const [reversalModal, setReversalModal] = useState<{ id: string } | null>(null);
    const [reason, setReason] = useState("");

    return (
        <>
            <DataTableWithFilters<TransactionRecord>
                config={{
                    columns: getTransactionColumns(),
                    data: transactions,
                    pagination,
                    loading,
                    filters,
                    actions: onReverse
                        ? (record) => (
                              <div className="flex justify-center">
                                  <Button
                                      type="text"
                                      danger
                                      icon={<RollbackOutlined className="text-xs" />}
                                      disabled={record.status === "reversed"}
                                      loading={isReversing === record.id}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          setReversalModal({ id: record.id });
                                      }}
                                      className="hover:bg-red-50 flex items-center justify-center h-8 w-8 rounded-full"
                                  />
                              </div>
                          )
                        : undefined,
                    onFiltersChange,
                }}
            />

            {onReverse && (
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
                    <div className="pt-4">
                        <Text type="secondary" className="block mb-4">
                            Reversing a transaction will create a mirror rebuttal transaction in the
                            ledger. This action is irreversible and will be logged for auditing.
                        </Text>
                        <div className="mb-2">
                            <Text strong type="secondary" className="text-[10px] uppercase">
                                Reason for Reversal
                            </Text>
                        </div>
                        <Input.TextArea
                            rows={4}
                            placeholder="Provide a specific reason for this reversal..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </Modal>
            )}
        </>
    );
};
