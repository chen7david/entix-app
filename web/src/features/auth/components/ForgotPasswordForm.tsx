import { MailOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { Alert, Button, Form, Input, Typography } from "antd";
import type React from "react";
import { Link } from "react-router";

const { Text } = Typography;

export interface ForgotPasswordValues {
    email: string;
}

interface ForgotPasswordFormProps {
    onSubmit: (values: ForgotPasswordValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    onSubmit,
    isLoading,
    apiError,
}) => {
    return (
        <>
            {apiError && (
                <Alert message={apiError} type="error" showIcon style={{ marginBottom: 24 }} />
            )}

            <Form name="forgotPassword" onFinish={onSubmit} layout="vertical" size="large">
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: "Please input your email!" },
                        { type: "email", message: "Please enter a valid email!" },
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading} block>
                        Send Reset Link
                    </Button>
                </Form.Item>

                <div style={{ textAlign: "center" }}>
                    <Text>
                        Remember your password? <Link to={AppRoutes.auth.signIn}>Sign in</Link>
                    </Text>
                </div>
            </Form>
        </>
    );
};
