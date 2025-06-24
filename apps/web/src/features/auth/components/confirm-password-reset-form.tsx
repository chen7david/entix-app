import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createSchemaFieldRule } from 'antd-zod';
import { confirmForgotPasswordSchema, type ConfirmForgotPasswordDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';
import { App } from 'antd';
import { ResponsiveContainer } from '@shared/components/layout';

const { Title, Text } = Typography;

// Create rules from Zod schema
const confirmForgotPasswordRules = createSchemaFieldRule(confirmForgotPasswordSchema);

/**
 * ConfirmPasswordReset form component - handles form logic and UI
 * Supports username in URL query parameters
 */
export const ConfirmPasswordResetForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<ConfirmForgotPasswordDto>();
  const { message } = App.useApp();

  // Get username from URL
  const username = searchParams.get('username') || '';

  const confirmPasswordResetMutation = useMutation({
    mutationFn: async (confirmData: ConfirmForgotPasswordDto) => {
      return apiClient.auth.confirmForgotPassword(confirmData);
    },
    onSuccess: () => {
      message.success('Password reset successfully! You can now sign in with your new password.');
      navigate('/auth/login');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Password reset failed');
      } else {
        message.error('An unexpected error occurred');
      }
    },
  });

  const handleSubmit = (values: ConfirmForgotPasswordDto) => {
    confirmPasswordResetMutation.mutate(values);
  };

  // Auto-fill username if provided in URL
  useEffect(() => {
    if (username) {
      form.setFieldsValue({ username });
    }
  }, [username, form]);

  return (
    <ResponsiveContainer maxWidth="400px" padding="24px">
      <Card style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Set New Password
          </Title>
          <Text type="secondary">Enter the code sent to your email and your new password</Text>
        </div>

        {username && (
          <Alert
            message={`Resetting password for: ${username}`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          name="confirm-password-reset"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item name="username" label="Username" rules={[confirmForgotPasswordRules]}>
            <Input prefix={<UserOutlined />} placeholder="Enter your username" autoComplete="username" />
          </Form.Item>

          <Form.Item name="confirmationCode" label="Reset Code" rules={[confirmForgotPasswordRules]}>
            <Input.OTP length={6} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="password" label="New Password" rules={[confirmForgotPasswordRules]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" autoComplete="new-password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={confirmPasswordResetMutation.isPending}
              disabled={confirmPasswordResetMutation.isPending}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Remember your password?{' '}
            <Link to="/auth/login" style={{ color: 'var(--ant-color-primary)' }}>
              Back to Sign In
            </Link>
          </Text>
        </div>
      </Card>
    </ResponsiveContainer>
  );
};
