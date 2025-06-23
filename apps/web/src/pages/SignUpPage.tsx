import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createSchemaFieldRule } from 'antd-zod';
import { signUpSchema, type SignUpDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';
import { App } from 'antd';

const { Title, Text } = Typography;

// Create rules from Zod schema
const signUpRules = createSchemaFieldRule(signUpSchema);

/**
 * SignUpPage component for user registration
 * Supports invitation code in URL query parameters
 * URL: /auth/signup?invitationCode=ABC123
 */
export const SignUpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<SignUpDto>();
  const { message } = App.useApp();

  // Get invitation code from URL
  const invitationCode = searchParams.get('invitationCode') || '';

  // Pre-fill invitation code from URL
  useEffect(() => {
    if (invitationCode) {
      form.setFieldValue('invitationCode', invitationCode);
    }
  }, [invitationCode, form]);

  const signUpMutation = useMutation({
    mutationFn: async (signUpData: SignUpDto) => {
      return apiClient.auth.signUp(signUpData);
    },
    onSuccess: () => {
      message.success('Registration successful! Please check your email for confirmation.');
      const email = form.getFieldValue('email');
      // Navigate to confirmation page with email in URL
      navigate(`/auth/confirm-signup?email=${encodeURIComponent(email)}`);
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError) {
        message.error(error.response?.data.message || 'Registration failed');
      } else {
        message.error('An unexpected error occurred');
      }
    },
  });

  const handleSubmit = (values: SignUpDto) => {
    signUpMutation.mutate(values);
  };

  return (
    <Card style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Create Account
        </Title>
        <Text type="secondary">Sign up for a new account</Text>
      </div>

      <Form form={form} name="signup" onFinish={handleSubmit} layout="vertical" size="large" requiredMark={false}>
        <Form.Item name="username" rules={[signUpRules]}>
          <Input prefix={<UserOutlined />} placeholder="Username" autoComplete="username" />
        </Form.Item>

        <Form.Item name="email" rules={[signUpRules]}>
          <Input prefix={<MailOutlined />} placeholder="Email address" autoComplete="email" />
        </Form.Item>

        <Form.Item name="password" rules={[signUpRules]}>
          <Input.Password prefix={<LockOutlined />} placeholder="Password" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
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
          <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" autoComplete="new-password" />
        </Form.Item>

        <Form.Item name="invitationCode" rules={[signUpRules]}>
          <Input
            prefix={<KeyOutlined />}
            placeholder="Invitation code"
            autoComplete="off"
            maxLength={6}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button type="primary" htmlType="submit" block loading={signUpMutation.isPending}>
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">
          Already have an account?{' '}
          <Link to="/auth/login" style={{ color: 'var(--ant-color-primary)' }}>
            Sign in
          </Link>
        </Text>
      </div>
    </Card>
  );
};
