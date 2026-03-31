import {
    FINANCIAL_ACCOUNTS,
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    FINANCIAL_CURRENCY_CONFIG,
} from "@shared";
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from "antd";
import type React from "react";
import { useAdminCredit } from "../hooks/useAdminCredit";
import type { WalletAccount } from "../hooks/useWalletBalance";

type Props = {
    open: boolean;
    onClose: () => void;
    organizationId?: string;
    accounts?: WalletAccount[];
};

export const AdminCreditDrawer: React.FC<Props> = ({ open, onClose, organizationId, accounts }) => {
    const [form] = Form.useForm();
    const { mutate, isPending } = useAdminCredit();

    const onFinish = (values: {
        destinationAccountId: string;
        currencyId: string;
        amountDollars: number;
        description?: string;
    }) => {
        if (!organizationId) return;
        mutate(
            {
                organizationId,
                categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
                platformTreasuryAccountId: FINANCIAL_ACCOUNTS.PLATFORM_TREASURY,
                destinationAccountId: values.destinationAccountId,
                currencyId: values.currencyId,
                amountCents: Math.round(values.amountDollars * 100),
                description: values.description,
            },
            {
                onSuccess: () => {
                    form.resetFields();
                    onClose();
                },
            }
        );
    };

    return (
        <Drawer
            title="Credit Org Account"
            width={440}
            open={open}
            onClose={onClose}
            extra={
                <Space>
                    <Button onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={isPending}>
                        Confirm Credit
                    </Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="destinationAccountId"
                    label="Destination Account"
                    rules={[{ required: true }]}
                >
                    <Select placeholder="Select account to credit">
                        {accounts?.map((acc) => (
                            <Select.Option key={acc.id} value={acc.id}>
                                {acc.name} — Balance: {(acc.balanceCents / 100).toFixed(2)}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="currencyId"
                    label="Currency"
                    initialValue={FINANCIAL_CURRENCIES.USD}
                    rules={[{ required: true }]}
                >
                    <Select>
                        {[
                            FINANCIAL_CURRENCIES.USD,
                            FINANCIAL_CURRENCIES.ETD,
                            FINANCIAL_CURRENCIES.CAD,
                            FINANCIAL_CURRENCIES.CNY,
                            FINANCIAL_CURRENCIES.EUR,
                        ].map((id) => {
                            const config =
                                FINANCIAL_CURRENCY_CONFIG[
                                    id as keyof typeof FINANCIAL_CURRENCY_CONFIG
                                ];
                            return (
                                <Select.Option key={id} value={id}>
                                    {config.code} — {config.name}
                                </Select.Option>
                            );
                        })}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="amountDollars"
                    label="Amount"
                    rules={[{ required: true }, { type: "number", min: 0.01 }]}
                    getValueFromEvent={(val) => val}
                    getValueProps={(val) => ({ value: val })}
                >
                    <InputNumber
                        min={0.01}
                        step={1}
                        precision={2}
                        prefix="$"
                        style={{ width: "100%" }}
                        placeholder="0.00"
                    />
                </Form.Item>

                <Form.Item name="description" label="Reason (optional)">
                    <Input.TextArea rows={2} placeholder="e.g. Opening balance, Support credit" />
                </Form.Item>
            </Form>
        </Drawer>
    );
};
