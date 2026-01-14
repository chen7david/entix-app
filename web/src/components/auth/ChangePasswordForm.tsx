import React from 'react';
import { Form, Input, Button, Alert, Checkbox } from 'antd';
import { LockOutlined } from '@ant-design/icons';

export interface ChangePasswordValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    revokeOtherSessions?: boolean;
}

interface ChangePasswordFormProps {
    onSubmit: (values: ChangePasswordValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit, isLoading, apiError }) => {
    const [form] = Form.useForm();

    return (
        <>
            {apiError && (
                <Alert
                    message={apiError}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            <Form
                form={form}
                name="changePassword"
                onFinish={onSubmit}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[
                        { required: true, message: 'Please input your current password!' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
                </Form.Item>

                <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                        { required: true, message: 'Please input your new password!' },
                        { min: 8, message: 'Password must be at least 8 characters!' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    label="Confirm New Password"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: 'Please confirm your new password!' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Passwords do not match!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
                </Form.Item>

                <Form.Item name="revokeOtherSessions" valuePropName="checked">
                    <Checkbox>Sign out other devices</Checkbox>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={isLoading}>
                        Change Password
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};
