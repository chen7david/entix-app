import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { signUp } from '../../lib/auth-client';
import { Link, useNavigate } from 'react-router';

const { Title, Text } = Typography;

export const SignUpForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            }, {
                onSuccess: () => {
                    message.success('Account created! Please check your email for verification.');
                    navigate('/auth/login');
                },
                onError: (ctx) => {
                    message.error(ctx.error.message);
                }
            });
        } catch (error) {
            message.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card style={{ width: 400, margin: '0 auto', marginTop: 50 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2}>Sign Up</Title>
                <Text type="secondary">Create your account to get started</Text>
            </div>

            <Form
                form={form}
                name="signup"
                onFinish={onFinish}
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
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Sign Up
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>Already have an account? <Link to="/auth/login">Log in</Link></Text>
                </div>
            </Form>
        </Card>
    );
};
