import {
    FINANCIAL_CATEGORIES,
    FINANCIAL_CURRENCIES,
    FINANCIAL_CURRENCY_CONFIG,
    getTreasuryAccountId,
} from "@shared";
import { Button, Drawer, Form, Input, InputNumber, Select, Space, Typography } from "antd";
import React from "react";

const { Text } = Typography;

import { useAdminCredit } from "../hooks/useAdminCredit";
import type { WalletAccount } from "../hooks/useWalletBalance";

type Props = {
    open: boolean;
    onClose: () => void;
    organizationId?: string;
    accounts?: WalletAccount[];
    preSelectedAccount?: WalletAccount;
};

export const AdminCreditDrawer: React.FC<Props> = ({
    open,
    onClose,
    organizationId,
    accounts,
    preSelectedAccount,
}) => {
    const [form] = Form.useForm();
    const { mutate, isPending } = useAdminCredit();

    // Sync form with pre-selected account when drawer opens
    React.useEffect(() => {
        if (open && preSelectedAccount) {
            form.setFieldsValue({
                destinationAccountId: preSelectedAccount.id,
                currencyId: preSelectedAccount.currencyId,
            });
        }
    }, [open, preSelectedAccount, form]);

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
                platformTreasuryAccountId: getTreasuryAccountId(values.currencyId),
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

    const currencyConfig = preSelectedAccount
        ? FINANCIAL_CURRENCY_CONFIG[
              preSelectedAccount.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
          ]
        : null;

    return (
        <Drawer
            title={
                preSelectedAccount
                    ? `Credit Account: ${preSelectedAccount.name}`
                    : "Credit Org Account"
            }
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
                {!preSelectedAccount && (
                    <>
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
                                {Object.values(FINANCIAL_CURRENCIES).map((id) => {
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
                    </>
                )}

                {preSelectedAccount && (
                    <div
                        style={{
                            marginBottom: 24,
                            padding: "16px",
                            background: "#fafafa",
                            borderRadius: "8px",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            TARGET ACCOUNT
                        </Text>
                        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
                            {preSelectedAccount.name}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Current Balance: </Text>
                            <Text strong>
                                {currencyConfig?.symbol || ""}
                                {(preSelectedAccount.balanceCents / 100).toFixed(2)}{" "}
                                {currencyConfig?.code}
                            </Text>
                        </div>
                        {/* Hidden fields to ensure form.submit() still works */}
                        <Form.Item name="destinationAccountId" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item name="currencyId" hidden>
                            <Input />
                        </Form.Item>
                    </div>
                )}

                <Form.Item
                    name="amountDollars"
                    label="Amount to Credit"
                    rules={[{ required: true }, { type: "number", min: 0.01 }]}
                >
                    <InputNumber
                        min={0.01}
                        step={1}
                        precision={2}
                        prefix={currencyConfig?.symbol || "$"}
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
