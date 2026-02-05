import React from 'react';
import { Form, Input, Button, Modal, App } from 'antd';
import { useSetPin } from '@web/src/hooks/finance/useFinance';

interface PinManagementProps {
    visible: boolean;
    onClose: () => void;
}

export const PinManagement: React.FC<PinManagementProps> = ({ visible, onClose }) => {
    const [form] = Form.useForm();
    const { mutate: setPin, isPending } = useSetPin();
    const { message } = App.useApp();

    const onFinish = (values: any) => {
        setPin({
            pin: values.pin,
            password: values.currentPassword
        }, {
            onSuccess: () => {
                message.success('PIN updated successfully');
                form.resetFields();
                onClose();
            },
            onError: (err) => {
                message.error(err.message || 'Failed to update PIN');
            }
        });
    };

    return (
        <Modal
            title="Manage Transaction PIN"
            open={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password placeholder="Enter your login password" />
                </Form.Item>

                <Form.Item
                    name="pin"
                    label="New PIN"
                    rules={[
                        { required: true, message: 'Please enter a 4-digit PIN' },
                        { len: 4, message: 'PIN must be exactly 4 digits' }
                    ]}
                >
                    <Input.Password maxLength={4} placeholder="New 4-digit PIN" />
                </Form.Item>

                <Form.Item
                    name="confirmPin"
                    label="Confirm PIN"
                    dependencies={['pin']}
                    rules={[
                        { required: true, message: 'Please confirm your PIN' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('pin') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two PINs do not match!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password maxLength={4} placeholder="Confirm new PIN" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isPending} block>
                        Update PIN
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};
