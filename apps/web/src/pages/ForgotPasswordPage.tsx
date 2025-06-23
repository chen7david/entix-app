import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createSchemaFieldRule } from 'antd-zod';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';

const { Title, Text } = Typography;

// Create rules from Zod schema
const forgotPasswordRules = createSchemaFieldRule(forgotPasswordSchema);

/**
 * ForgotPasswordPage component for initiating password reset
 */
export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<ForgotPasswordDto>();

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
    <Card className="w-full shadow-lg">
      <div className="text-center mb-6">
        <Title level={2} className="mb-2">
          Reset Password
        </Title>
        <Text type="secondary">Enter your username to receive a password reset code</Text>
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

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" loading={forgotPasswordMutation.isPending} block>
            Send Reset Code
          </Button>
        </Form.Item>
      </Form>

      <div className="space-y-2 text-center">
        <div>
          <Text type="secondary">
            Remember your password?{' '}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </Text>
        </div>
        <div>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </Text>
        </div>
      </div>
    </Card>
  );
};
