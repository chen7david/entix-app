import React from 'react';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { links } from '@web/src/constants/links';

const { Text } = Typography;

export interface SignInValues {
    email: string;
    password: string;
}

interface SignInFormProps {
    onSubmit: (values: SignInValues) => void;
    isLoading: boolean;
    apiError?: string;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSubmit, isLoading, apiError }) => {
    const [form] = Form.useForm();

    return (
        <>

            {apiError && (
                <Alert
                    title="Error"
                    description={apiError}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            <Form
                form={form}
                name="signin"
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

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={isLoading}>
                        Sign In
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>Don't have an account? <Link to={links.auth.signUp}>Sign up</Link></Text>
                </div>
            </Form>
        </>
    );
};
