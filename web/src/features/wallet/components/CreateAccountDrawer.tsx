import { FINANCIAL_CURRENCIES, FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { Button, Drawer, Form, Input, Select, Space } from "antd";
import type React from "react";
import { useCreateAccount } from "../hooks/useCreateAccount";

type Props = {
    open: boolean;
    onClose: () => void;
    orgId?: string;
};

export const CreateAccountDrawer: React.FC<Props> = ({ open, onClose, orgId }) => {
    const [form] = Form.useForm();
    const { mutate, isPending } = useCreateAccount(orgId);

    const onFinish = (values: { name: string; currencyId: string }) => {
        if (!orgId) return;

        mutate(
            {
                name: values.name,
                currencyId: values.currencyId,
                ownerType: "org",
                ownerId: orgId,
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
            title="Create New Account"
            size="default"
            open={open}
            onClose={onClose}
            extra={
                <Space>
                    <Button onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={isPending}>
                        Create
                    </Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="name"
                    label="Account Name"
                    rules={[{ required: true, message: "Name is required" }]}
                >
                    <Input placeholder="e.g. General Fund, Payroll, Marketing" />
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
                            FINANCIAL_CURRENCIES.CAD,
                            FINANCIAL_CURRENCIES.CNY,
                            FINANCIAL_CURRENCIES.EUR,
                            FINANCIAL_CURRENCIES.ETD,
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
            </Form>
        </Drawer>
    );
};
