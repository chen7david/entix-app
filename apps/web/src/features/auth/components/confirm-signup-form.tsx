import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createSchemaFieldRule } from 'antd-zod';
import { confirmSignUpSchema, type ConfirmSignUpDto, type ResendConfirmationCodeDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';
import { App } from 'antd';
import { ResponsiveContainer } from '@shared/components/layout';

const { Title, Text } = Typography;

// Create rules from Zod schema
const confirmSignUpRules = createSchemaFieldRule(confirmSignUpSchema);

/**
 * ConfirmSignUp form component - handles form logic and UI
 * Supports email in URL query parameters
 */
export const ConfirmSignUpForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<ConfirmSignUpDto>();
  const { message } = App.useApp();

  // Get email from URL
  const email = searchParams.get('email') || '';

  const confirmSignUpMutation = useMutation({
    mutationFn: async (confirmData: ConfirmSignUpDto) => {
      return apiClient.auth.confirmSignUp(confirmData);
    },
    onSuccess: () => {
      message.success('Email confirmed successfully! You can now sign in.');
      navigate('/auth/login');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Confirmation failed');
      } else {
        message.error('An unexpected error occurred');
      }
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async (resendData: ResendConfirmationCodeDto) => {
      return apiClient.auth.resendConfirmationCode(resendData);
    },
    onSuccess: result => {
      message.success(`Confirmation code sent to ${result.destination}`);
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Failed to resend code');
      } else {
        message.error('An unexpected error occurred');
      }
    },
  });

  const handleConfirm = (values: ConfirmSignUpDto) => {
    confirmSignUpMutation.mutate(values);
  };

  const handleResendCode = () => {
    const username = form.getFieldValue('username');
    if (!username) {
      message.error('Please enter your username first');
      return;
    }

    resendCodeMutation.mutate({ username });
  };

  return (
    <ResponsiveContainer maxWidth="400px" padding="24px">
      <Card style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Confirm Account
          </Title>
          <Text type="secondary">Enter the confirmation code sent to your email</Text>
        </div>

        {email && (
          <Alert
            message={`Confirmation code sent to: ${email}`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          name="confirm-signup"
          onFinish={handleConfirm}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item name="username" label="Username" rules={[confirmSignUpRules]}>
            <Input prefix={<MailOutlined />} placeholder="Enter your username" autoComplete="username" />
          </Form.Item>

          <Form.Item name="confirmationCode" label="Confirmation Code" rules={[confirmSignUpRules]}>
            <Input.OTP length={6} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button type="primary" htmlType="submit" block loading={confirmSignUpMutation.isPending}>
              Confirm Account
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button block onClick={handleResendCode} loading={resendCodeMutation.isPending}>
              Resend Code
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Already confirmed?{' '}
            <Link to="/auth/login" style={{ color: 'var(--ant-color-primary)' }}>
              Sign in
            </Link>
          </Text>
        </div>
      </Card>
    </ResponsiveContainer>
  );
};
