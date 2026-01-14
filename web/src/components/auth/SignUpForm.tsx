import React from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export interface SignUpValues {
    email: string;
    password: string;
    name: string;
}

interface SignUpFormProps {
    onSubmit: (values: SignUpValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading, apiError }) => {
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
                name="signup"
                onFinish={onSubmit}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="name"
                    rules={[{ required: true, message: 'Please input your name!' }]}
                >
                    <Input prefix={<UserOutlined />} placeholder="Full Name" />
                </Form.Item>

                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please input your email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[
                        { required: true, message: 'Please input your password!' },
                        { min: 8, message: 'Password must be at least 8 characters!' }
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={isLoading}>
                        Sign Up
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>Already have an account? <Link to={links.auth.signIn}>Sign in</Link></Text>
                </div>
            </Form>
        </>
    );
};
