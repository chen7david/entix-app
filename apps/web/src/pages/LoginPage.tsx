import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { loginSchema, type LoginDto } from '@repo/entix-sdk';
import { useState } from 'react';
import { useLogin } from '../lib/auth-hooks';

const { Title, Text } = Typography;

// Create rules from Zod schema
const rules = createSchemaFieldRule(loginSchema);

export const LoginPage = () => {
  const [form] = Form.useForm<LoginDto>();
  const [error, setError] = useState<string | null>(null);

  const login = useLogin();

  const onSubmit = async (values: LoginDto) => {
    try {
      setError(null);
      await login.mutateAsync(values);
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-2xl">
      <Title level={2} className="text-center mb-6">
        Login
      </Title>

      {error && (
        <Alert
          message="Login Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        autoComplete="off"
        requiredMark={false}
        disabled={login.isPending}
      >
        <Form.Item name="username" label="Username" rules={[rules]}>
          <Input placeholder="Enter your username" />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[rules]}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <div className="flex justify-between text-sm mt-4 px-2">
        <Text>
          Don't have an account? <Link to="/register">Register</Link>
        </Text>
        <Text>
          <Link to="/password-reset">Forgot password?</Link>
        </Text>
      </div>
    </Card>
  );
};
