import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@repo/entix-sdk';
import { useForgotPassword } from '../hooks/useAuth';

const { Title, Text } = Typography;

// Create rules from Zod schema
const forgotPasswordRules = createSchemaFieldRule(forgotPasswordSchema);

/**
 * ForgotPassword form component - handles form logic and UI
 */
export const ForgotPasswordForm = () => {
  const [form] = Form.useForm<ForgotPasswordDto>();
  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = (values: ForgotPasswordDto) => {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        const username = form.getFieldValue('username');
        // Navigate to password reset confirmation with username in URL
        window.location.href = `/auth/confirm-password-reset?username=${encodeURIComponent(username)}`;
      },
    });
  };

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'none',
        border: '1px solid var(--ant-color-border)',
        backgroundColor: 'transparent',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Forgot Password
        </Title>
        <Text type="secondary">Enter your username to reset your password</Text>
      </div>

      <Form
        form={form}
        name="forgot-password"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        requiredMark={false}
      >
        <Form.Item name="username" label="Username" rules={[forgotPasswordRules]}>
          <Input prefix={<UserOutlined />} placeholder="Enter your username" autoComplete="username" />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button type="primary" htmlType="submit" block loading={forgotPasswordMutation.isPending}>
            Send Reset Code
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="small">
          <Text type="secondary">
            Remember your password?{' '}
            <Link to="/auth/login" style={{ color: 'var(--ant-color-primary)' }}>
              Back to Sign In
            </Link>
          </Text>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link to="/auth/signup" style={{ color: 'var(--ant-color-primary)' }}>
              Sign up
            </Link>
          </Text>
        </Space>
      </div>
    </Card>
  );
};
