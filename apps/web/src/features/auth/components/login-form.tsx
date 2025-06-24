import { Card, Form, Input, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { loginSchema, type LoginDto } from '@repo/entix-sdk';
import { useLogin } from '../hooks/use-auth';
import { Button } from '@shared/components/ui';
import { ResponsiveContainer } from '@shared/components/layout';

const { Title, Text } = Typography;

// Create rules from Zod schema
const rules = createSchemaFieldRule(loginSchema);

/**
 * Login form component - handles form logic and UI
 */
export const LoginForm = () => {
  const [form] = Form.useForm<LoginDto>();
  const login = useLogin();

  const handleSubmit = async (values: LoginDto) => {
    try {
      await login.mutateAsync(values);
    } catch {
      // Error handling is done in the useLogin hook
    }
  };

  return (
    <ResponsiveContainer maxWidth="400px" padding="24px">
      <Card style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Welcome Back
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          requiredMark={false}
          disabled={login.isPending}
        >
          <Form.Item initialValue={'chen7david'} name="username" label="Username" rules={[rules]}>
            <Input prefix={<UserOutlined />} placeholder="Enter your username" autoComplete="username" />
          </Form.Item>

          <Form.Item initialValue={'password'} name="password" label="Password" rules={[rules]}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button variant="primary" size="large" loading={login.isPending} block htmlType="submit">
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
    </ResponsiveContainer>
  );
};
