import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createSchemaFieldRule } from 'antd-zod';
import { signUpSchema, type SignUpDto } from '@repo/entix-sdk';
import { apiClient } from '@lib/api-client';

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
    onSuccess: result => {
      message.success('Registration successful! Please check your email for confirmation.');
      // Navigate to confirmation page with email in URL state
      navigate(`/auth/confirm-signup?email=${encodeURIComponent(result.email)}`);
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
    <Card className="w-full shadow-lg">
      <div className="text-center mb-6">
        <Title level={2} className="mb-2">
          Create Account
        </Title>
        <Text type="secondary">Join us to get started</Text>
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

        <Form.Item className="mb-4">
          <Button type="primary" htmlType="submit" loading={signUpMutation.isPending} block>
            Create Account
          </Button>
        </Form.Item>

        <div className="text-center">
          <Text type="secondary">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </Text>
        </div>
      </Form>
    </Card>
  );
};
