import { Button, Card, Form, Input, Typography, Space } from 'antd';
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
    <Card style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Welcome Back
        </Title>
        <Text type="secondary">Sign in to your account</Text>
      </div>
      Testing 123
      <Form
        form={form}
        name="login"
        layout="vertical"
        onFinish={onSubmit}
        size="large"
        requiredMark={false}
        disabled={login.isPending}
      >
        <Form.Item initialValue={'chen7david'} name="username" label="Username" rules={[rules]}>
          <Input prefix={<UserOutlined />} placeholder="Enter your username" autoComplete="username" />
        </Form.Item>

        <Form.Item initialValue={'password'} name="password" label="Password" rules={[rules]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" autoComplete="current-password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            Sign In
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="small">
          <div>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/auth/signup" style={{ color: 'var(--ant-color-primary)' }}>
                Sign up
              </Link>
            </Text>
          </div>
          <div>
            <Link to="/auth/forgot-password" style={{ color: 'var(--ant-color-primary)' }}>
              Forgot your password?
            </Link>
          </div>
        </Space>
      </div>
    </Card>
  );
};
