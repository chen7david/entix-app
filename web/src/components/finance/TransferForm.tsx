import React from 'react';
import { Form, Input, Button, Select, InputNumber, App } from 'antd';
import { useTransfer, useBalance } from '@web/src/hooks/finance/useFinance';

export const TransferForm: React.FC = () => {
    const [form] = Form.useForm();
    const { mutate: transfer, isPending } = useTransfer();
    const { message } = App.useApp();

    const { data: accounts } = useBalance();

    const onFinish = (values: any) => {
        transfer({
            ...values,
            amount: Math.round(values.amount * 100) // Convert to cents
        }, {
            onSuccess: () => {
                message.success("Transfer successful");
                form.resetFields();
            },
            onError: (err) => {
                message.error(err.message);
            }
        });
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item name="email" label="Recipient Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="user@example.com" />
            </Form.Item>
            <Form.Item name="amount" label="Amount" rules={[{ required: true, type: 'number', min: 0.01 }]}>
                <InputNumber style={{ width: '100%' }} precision={2} />
            </Form.Item>
            <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                <Select>
                    {accounts?.map(a => (
                        <Select.Option key={a.currency} value={a.currency}>{a.currency}</Select.Option>
                    ))}
                    {!accounts && <Select.Option value="ETP">ETP</Select.Option>}
                </Select>
            </Form.Item>
            <Form.Item name="pin" label="Transaction PIN" rules={[{ required: true, len: 4 }]}>
                <Input.Password placeholder="4-digit PIN" maxLength={4} />
            </Form.Item>
            <Form.Item name="description" label="Description">
                <Input.TextArea />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={isPending}>
                Transfer
            </Button>
        </Form>
    );
};
