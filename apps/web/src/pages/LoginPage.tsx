import { Button, Card, Form, Input, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { loginSchema, type LoginDto } from '@repo/entix-sdk';
import { useLogin } from '@/hooks/auth.hook';

const { Title, Text } = Typography;

// Create rules from Zod schema
const rules = createSchemaFieldRule(loginSchema);

export const LoginPage = () => {
  const [form] = Form.useForm<LoginDto>();

  const login = useLogin();

  const onSubmit = async (values: LoginDto) => {
    try {
      await login.mutateAsync(values);
    } catch {
      // Error handling is done in the useLogin hook
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <div className="text-center mb-6">
        <Title level={2} className="mb-2">
          Welcome Back
        </Title>
        <Text type="secondary">Sign in to your account</Text>
      </div>

      <Form
        form={form}
        name="login"
        layout="vertical"
        onFinish={onSubmit}
        size="large"
        requiredMark={false}
        disabled={login.isPending}
      >
        <Form.Item name="username" label="Username" rules={[rules]}>
          <Input prefix={<UserOutlined />} placeholder="Enter your username" autoComplete="username" />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[rules]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" autoComplete="current-password" />
        </Form.Item>

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <div className="space-y-2 text-center">
        <div>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </Text>
        </div>
        <div>
          <Link to="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
            Forgot your password?
          </Link>
        </div>
      </div>
    </Card>
  );
};
