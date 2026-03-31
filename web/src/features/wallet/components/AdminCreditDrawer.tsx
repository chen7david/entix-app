import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCY_CONFIG, getTreasuryAccountId } from "@shared";
import { Button, Drawer, Form, Input, InputNumber, Select, Typography } from "antd";
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

// Common reasons for administrative credit
const COMMON_REASONS = ["Funding", "System Correction", "Support Grant", "Reimbursement", "Other"];

export const AdminCreditDrawer: React.FC<Props> = ({
    open,
    onClose,
    organizationId,
    accounts,
    preSelectedAccount,
}) => {
    const [form] = Form.useForm();
    const { mutate, isPending } = useAdminCredit();

    const [reasonType, setReasonType] = React.useState<string>(COMMON_REASONS[0]);

    // Sync form with pre-selected account when drawer opens
    React.useEffect(() => {
        if (open) {
            let targetAccount = preSelectedAccount;

            // If no account is pre-selected, find the funding account (General Fund)
            if (!targetAccount && accounts && accounts.length > 0) {
                targetAccount = accounts.find((a) => a.isFundingAccount) || accounts[0];
            }

            if (targetAccount) {
                form.setFieldsValue({
                    destinationAccountId: targetAccount.id,
                    currencyId: targetAccount.currencyId,
                    reasonSelect: COMMON_REASONS[0],
                });
                setReasonType(COMMON_REASONS[0]);
            } else {
                form.setFieldsValue({
                    reasonSelect: COMMON_REASONS[0],
                });
                setReasonType(COMMON_REASONS[0]);
            }
        }
    }, [open, preSelectedAccount, accounts, form]);

    const handleAccountChange = (accountId: string) => {
        const account = accounts?.find((a) => a.id === accountId);
        if (account) {
            form.setFieldValue("currencyId", account.currencyId);
        }
    };

    const handleReasonChange = (value: string) => {
        setReasonType(value);
        if (value !== "Other") {
            form.setFieldValue("description", value);
        } else {
            form.setFieldValue("description", "");
        }
    };

    const onFinish = (values: {
        destinationAccountId: string;
        currencyId: string;
        amountDollars: number;
        reasonSelect: string;
        description?: string;
    }) => {
        if (!organizationId) return;

        // Use the select value or the custom description
        const finalDescription =
            values.reasonSelect === "Other" ? values.description : values.reasonSelect;

        mutate(
            {
                organizationId,
                categoryId: FINANCIAL_CATEGORIES.CASH_DEPOSIT,
                platformTreasuryAccountId: getTreasuryAccountId(values.currencyId),
                destinationAccountId: values.destinationAccountId,
                currencyId: values.currencyId,
                amountCents: Math.round(values.amountDollars * 100),
                description: finalDescription,
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
                <Button type="primary" onClick={() => form.submit()} loading={isPending}>
                    Confirm Credit
                </Button>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* Always need currencyId for the API mutate call */}
                <Form.Item name="currencyId" hidden>
                    <Input />
                </Form.Item>

                {!preSelectedAccount ? (
                    <Form.Item
                        name="destinationAccountId"
                        label="Destination Account"
                        rules={[{ required: true }]}
                    >
                        <Select
                            size="large"
                            placeholder="Select account to credit"
                            onChange={handleAccountChange}
                        >
                            {accounts?.map((acc) => (
                                <Select.Option key={acc.id} value={acc.id}>
                                    <div className="flex justify-between items-center">
                                        <span>{acc.name}</span>
                                        <Text type="secondary" style={{ fontSize: 10 }}>
                                            {FINANCIAL_CURRENCY_CONFIG[
                                                acc.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
                                            ]?.code || acc.currencyId}
                                        </Text>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                ) : (
                    <div
                        style={{
                            marginBottom: 24,
                            padding: "16px",
                            background: "var(--ant-color-fill-quaternary)",
                            borderRadius: "8px",
                            border: "1px solid var(--ant-color-border-secondary)",
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
                        {/* Hidden field to ensure form.submit() still works */}
                        <Form.Item name="destinationAccountId" hidden>
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
                        size="large"
                        min={0.01}
                        step={1}
                        precision={2}
                        prefix={currencyConfig?.symbol || "$"}
                        style={{ width: "100%" }}
                        placeholder="0.00"
                    />
                </Form.Item>

                <Form.Item name="reasonSelect" label="Reason" rules={[{ required: true }]}>
                    <Select size="large" onChange={handleReasonChange}>
                        {COMMON_REASONS.map((r) => (
                            <Select.Option key={r} value={r}>
                                {r}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                {reasonType === "Other" && (
                    <Form.Item
                        name="description"
                        label="Specifiy Reason"
                        rules={[{ required: true, message: "Please specify the reason" }]}
                    >
                        <Input.TextArea
                            size="large"
                            rows={2}
                            placeholder="Provide details for this manual adjustment..."
                        />
                    </Form.Item>
                )}
            </Form>
        </Drawer>
    );
};
