import type { WalletAccountDTO } from "@shared";
import { useActivatedCurrencies } from "@web/src/features/finance";
import { UI_CONSTANTS } from "@web/src/utils/constants";
import { App, Button, Drawer, Form, Input, InputNumber, Select } from "antd";
import { type TransferInput, useWalletTransfer } from "../hooks/useWalletTransfer";

type TransferDrawerProps = {
    open: boolean;
    onClose: () => void;
    orgId?: string;
    accounts?: WalletAccountDTO[];
};

export const TransferDrawer = ({ open, onClose, orgId, accounts }: TransferDrawerProps) => {
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { mutate, isPending } = useWalletTransfer(orgId);
    const { currencies } = useActivatedCurrencies(orgId);

    const onFinish = (values: TransferInput) => {
        mutate(values, {
            onSuccess: () => {
                notification.success({
                    message: "Transfer Submitted",
                    description: "Your transfer has been processed successfully.",
                });
                onClose();
                form.resetFields();
            },
            onError: (err) => {
                notification.error({
                    message: "Transfer Failed",
                    description: err.message || "Transfer failed. Please check funds.",
                });
            },
        });
    };

    return (
        <Drawer
            title="Execute New Transfer"
            width={UI_CONSTANTS.RIGHT_DRAWER_WIDTH}
            onClose={onClose}
            open={open}
            extra={
                <Button type="primary" onClick={() => form.submit()} loading={isPending}>
                    Confirm Transfer
                </Button>
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
                        {currencies?.map((c) => (
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
