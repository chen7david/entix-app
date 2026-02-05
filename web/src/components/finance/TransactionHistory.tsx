import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Input, Radio, message } from 'antd';
import { useTransactions, useReverseTransaction } from '@web/src/hooks/finance/useFinance';
import { ReloadOutlined } from '@ant-design/icons';
import type { FinancialTransaction } from '@web/src/hooks/finance/useFinance';

export const TransactionHistory: React.FC = () => {
    // Add type for currency state
    const [currency, setCurrency] = useState<string | undefined>(undefined);
    const { data: transactions, isLoading, refetch } = useTransactions({ currency });

    // Reversal State
    const [reversalTx, setReversalTx] = useState<FinancialTransaction | null>(null);
    const [reason, setReason] = useState("");
    const { mutate: reverse, isPending: isReversing } = useReverseTransaction();

    const onReverse = () => {
        if (!reversalTx) return;
        reverse({ transactionId: reversalTx.id, reason }, {
            onSuccess: () => {
                message.success("Reversal successful");
                setReversalTx(null);
                setReason("");
                refetch();
            },
            onError: (err) => {
                message.error(err.message);
            }
        });
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'date',
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'TRANSFER' ? 'blue' : type === 'REVERSAL' ? 'orange' : 'default'}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: FinancialTransaction) => (
                <Button size="small" onClick={() => setReversalTx(record)} disabled={record.type === 'REVERSAL'}>
                    Reverse
                </Button>
            )
        }
    ];

    const expandedRowRender = (record: FinancialTransaction) => {
        const columns = [
            { title: 'Account', dataIndex: ['account', 'currency'], key: 'currency' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val: number) => (val / 100).toFixed(2) },
            { title: 'User ID', dataIndex: ['account', 'userId'], key: 'userId' },
        ];
        // We need to map postings correctly as dataIndex array might not work deeply if structure differs
        // record.postings is { amount, account: { currency, userId } }
        return <Table columns={columns} dataSource={record.postings} pagination={false} rowKey={(r: any) => Math.random().toString()} />;
    };

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <Radio.Group value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <Radio.Button value={undefined}>All</Radio.Button>
                    <Radio.Button value="ETP">ETP</Radio.Button>
                    <Radio.Button value="CNY">CNY</Radio.Button>
                </Radio.Group>
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
            </div>

            <Table
                columns={columns}
                dataSource={transactions}
                rowKey="id"
                loading={isLoading}
                expandable={{ expandedRowRender }}
            />

            <Modal
                title="Reverse Transaction"
                open={!!reversalTx}
                onCancel={() => setReversalTx(null)}
                onOk={onReverse}
                confirmLoading={isReversing}
            >
                <div style={{ marginBottom: 8 }}>Reason for reversal:</div>
                <Input.TextArea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Correction, fraud, etc."
                />
            </Modal>
        </div>
    );
};
