import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { signIn } from '../../lib/auth-client';
import { Link, useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

const { Title, Text } = Typography;

export const LoginForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await signIn.email({
                email: values.email,
                password: values.password,
            }, {
                onSuccess: () => {
                    message.success('Logged in successfully!');
                    navigate(links.dashboard.profile);
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
                <Title level={2}>Welcome Back</Title>
                <Text type="secondary">Please log in to continue</Text>
            </div>

            <Form
                form={form}
                name="login"
                onFinish={onFinish}
                layout="vertical"
                size="large"
            >
                <Form.Item
                    name="email"
                    initialValue={'chen7david+test1@gmail.com'}
                    rules={[
                        { required: true, message: 'Please input your email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                </Form.Item>

                <Form.Item
                    name="password"
                    initialValue={'@Password1'}
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Log In
                    </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                    <Text>Don't have an account? <Link to={links.auth.signUp}>Sign up</Link></Text>
                </div>
            </Form>
        </Card>
    );
};
