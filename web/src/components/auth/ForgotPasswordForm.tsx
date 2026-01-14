import React from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export interface ForgotPasswordValues {
    email: string;
}

interface ForgotPasswordFormProps {
    onSubmit: (values: ForgotPasswordValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSubmit, isLoading, apiError }) => {
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
                name="forgotPassword"
                onFinish={onSubmit}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please input your email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={isLoading}>
                        Send Reset Link
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>Remember your password? <Link to={links.auth.signIn}>Sign in</Link></Text>
                </div>
            </Form>
        </>
    );
};
