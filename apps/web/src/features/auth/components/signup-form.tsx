import { useEffect } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { signUpSchema, type SignUpDto } from '@repo/entix-sdk';
import { useSignUp } from '../hooks/useAuth';

const { Title, Text } = Typography;

// Create rules from Zod schema
const signUpRules = createSchemaFieldRule(signUpSchema);

/**
 * SignUp form component - handles form logic and UI
 * Supports invitation code in URL query parameters
 */
export const SignUpForm = () => {
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

  const signUpMutation = useSignUp();

  const handleSubmit = (values: SignUpDto) => {
    signUpMutation.mutate(values, {
      onSuccess: () => {
        const email = form.getFieldValue('email');
        // Navigate to confirmation page with email in URL
        window.location.href = `/auth/confirm-signup?email=${encodeURIComponent(email)}`;
      },
    });
  };

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        boxShadow: 'none',
        border: '1px solid var(--ant-color-border)',
        backgroundColor: 'transparent',
      }}
    >
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
