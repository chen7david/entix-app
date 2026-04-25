import { LockOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input } from "antd";
import type React from "react";

export interface ResetPasswordValues {
    newPassword: string;
    confirmPassword: string;
}

interface ResetPasswordFormProps {
    onSubmit: (values: ResetPasswordValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    onSubmit,
    isLoading,
    apiError,
}) => {
    const [form] = Form.useForm();

    return (
        <>
            {apiError && (
                <Alert message={apiError} type="error" showIcon style={{ marginBottom: 24 }} />
            )}

            <Form
                form={form}
                name="resetPassword"
                onFinish={onSubmit}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="newPassword"
                    rules={[
                        { required: true, message: "Please input your new password!" },
                        { min: 8, message: "Password must be at least 8 characters!" },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                </Form.Item>

                <Form.Item
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: "Please confirm your password!" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("newPassword") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("Passwords do not match!"));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading} block>
                        Reset Password
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};
