import { BankOutlined, LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input } from "antd";
import type React from "react";

export interface SignUpWithOrgValues {
    email: string;
    password: string;
    name: string;
    organizationName: string;
}

interface SignUpWithOrgFormProps {
    onSubmit: (values: SignUpWithOrgValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const SignUpWithOrgForm: React.FC<SignUpWithOrgFormProps> = ({
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
                name="signup-with-org"
                onFinish={onSubmit}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: "Please enter the user's full name" }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Full Name" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: "Please enter an email address" },
                        { type: "email", message: "Please enter a valid email address" },
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                </Form.Item>

                <Form.Item
                    name="organizationName"
                    label="Organization Name"
                    rules={[{ required: true, message: "Please enter the organization name" }]}
                >
                    <Input prefix={<BankOutlined />} placeholder="Organization Name" />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                        { required: true, message: "Please enter a password" },
                        { min: 8, message: "Password must be at least 8 characters" },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading} block>
                        Create User &amp; Organization
                    </Button>
                </Form.Item>
            </Form>
        </>
    );
};
