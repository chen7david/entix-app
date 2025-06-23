import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { loginSchema, type LoginDto, type LoginResultDto } from '@repo/entix-sdk';
import { useLoginMutation } from '../services/auth.service';
import { App } from 'antd';

const { Title, Text } = Typography;

// Create rules from Zod schema
const loginRules = createSchemaFieldRule(loginSchema);

/**
 * LoginPage component for user authentication
 * Refactored to use feature-based architecture
 */
export const LoginPage = () => {
  const [form] = Form.useForm<LoginDto>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const login = useLoginMutation({
    onSuccess: (result: LoginResultDto) => {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);

      message.success('Login successful!');
      navigate('/dashboard/users');
    },
    onError: (error: Error) => {
      message.error(error.message || 'Login failed');
    },
  });

  const handleSubmit = (values: LoginDto) => {
    login.mutate(values);
  };

  return (
    <Card
      style={{
        width: '100%',
        boxShadow: 'none',
        border: '1px solid var(--ant-color-border)',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Welcome Back
        </Title>
        <Text type="secondary">Sign in to your account</Text>
      </div>

      <Form form={form} name="login" onFinish={handleSubmit} layout="vertical" size="large" requiredMark={false}>
        <Form.Item name="username" label="Username" rules={[loginRules]}>
          <Input prefix={<UserOutlined />} placeholder="Enter your username" autoComplete="username" autoFocus />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[loginRules]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" autoComplete="current-password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={login.isPending}
            style={{
              height: '48px',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            {login.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
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
