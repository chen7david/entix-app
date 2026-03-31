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
        mutate(
            {
                name: values.name,
                currencyId: values.currencyId,
                ownerType: "org",
                ownerId: orgId!,
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
            width={400}
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
                    initialValue="fcur_cny"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="fcur_usd">USD — US Dollar</Select.Option>
                        <Select.Option value="fcur_cad">CAD — Canadian Dollar</Select.Option>
                        <Select.Option value="fcur_cny">CNY — Chinese Yuan</Select.Option>
                        <Select.Option value="fcur_etd">ETD — Entix Dollar</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Drawer>
    );
};
