import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createSchemaFieldRule } from 'antd-zod';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';
import { App } from 'antd';

const { Title, Text } = Typography;

// Create rules from Zod schema
const forgotPasswordRules = createSchemaFieldRule(forgotPasswordSchema);

/**
 * ForgotPasswordPage component for initiating password reset
 */
export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<ForgotPasswordDto>();
  const { message } = App.useApp();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (forgotPasswordData: ForgotPasswordDto) => {
      return apiClient.auth.forgotPassword(forgotPasswordData);
    },
    onSuccess: result => {
      message.success(`Password reset code sent to ${result.destination}`);
      const username = form.getFieldValue('username');
      // Navigate to password reset confirmation with username in URL
      navigate(`/auth/confirm-password-reset?username=${encodeURIComponent(username)}`);
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Failed to send password reset code');
      } else {
        message.error('An unexpected error occurred');
      }
    },
  });

  const handleSubmit = (values: ForgotPasswordDto) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <Card style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
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
