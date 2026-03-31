import { useActivatedCurrencies } from "@web/src/features/finance";
import { App, Button, Drawer, Form, Input, InputNumber, Select, Space } from "antd";
import type { WalletAccount } from "../hooks/useWalletBalance";
import { type TransferInput, useWalletTransfer } from "../hooks/useWalletTransfer";

type TransferDrawerProps = {
    open: boolean;
    onClose: () => void;
    orgId?: string;
    accounts?: WalletAccount[];
};

export const TransferDrawer = ({ open, onClose, orgId, accounts }: TransferDrawerProps) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const { mutate, isPending } = useWalletTransfer(orgId);
    const { data: currencyData } = useActivatedCurrencies(orgId);

    const onFinish = (values: TransferInput) => {
        mutate(values, {
            onSuccess: () => {
                message.success("Transfer submitted successfully");
                onClose();
                form.resetFields();
            },
            onError: (err) => {
                message.error(err.message || "Transfer failed. Please check funds.");
            },
        });
    };

    return (
        <Drawer
            title="Execute New Transfer"
            width={420}
            onClose={onClose}
            open={open}
            extra={
                <Space>
                    <Button onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={isPending}>
                        Confirm Transfer
                    </Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Source Account"
                    name="sourceAccountId"
                    rules={[{ required: true, message: "Please select source" }]}
                >
                    <Select placeholder="Select source account">
                        {accounts?.map((acc) => (
                            <Select.Option key={acc.id} value={acc.id} disabled={!acc.isActive}>
                                {acc.name} (Balance: ${(acc.balanceCents / 100).toFixed(2)})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Destination Account"
                    name="destinationAccountId"
                    rules={[
                        { required: true, message: "Please select destination" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("sourceAccountId") !== value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(
                                    new Error("Source and destination must be different")
                                );
                            },
                        }),
                    ]}
                >
                    <Select placeholder="Select destination account">
                        {accounts?.map((acc) => (
                            <Select.Option key={acc.id} value={acc.id} disabled={!acc.isActive}>
                                {acc.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Amount (in Dollars)"
                    name="amountCents"
                    rules={[{ required: true, message: "Amount is required" }]}
                    getValueFromEvent={(val) => Math.round(val * 100)}
                    getValueProps={(val) => ({ value: val ? val / 100 : undefined })}
                >
                    <InputNumber
                        min={0.01}
                        style={{ width: "100%" }}
                        placeholder="0.00"
                        precision={2}
                    />
                </Form.Item>

                <Form.Item
                    label="Currency"
                    name="currencyId"
                    rules={[{ required: true, message: "Please select a currency" }]}
                >
                    <Select placeholder="Select currency">
                        {currencyData?.currencies?.map((c) => (
                            <Select.Option key={c.id} value={c.id}>
                                {c.symbol} {c.code} — {c.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Category"
                    name="categoryId"
                    initialValue="fcat_internal_transfer"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="fcat_internal_transfer">
                            Internal Transfer
                        </Select.Option>
                        <Select.Option value="fcat_store_purchase">Store Purchase</Select.Option>
                        <Select.Option value="fcat_cash_deposit">Cash Deposit</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Description" name="description">
                    <Input.TextArea placeholder="Optional memo" rows={2} />
                </Form.Item>
            </Form>
        </Drawer>
    );
};
