import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { confirmSignUpSchema, type ConfirmSignUpDto } from '@repo/entix-sdk';
import { useConfirmSignUp, useResendConfirmationCode } from '../hooks/useAuth';
import { ResponsiveContainer } from '@shared/components/layout';

const { Title, Text } = Typography;

// Create rules from Zod schema
const confirmSignUpRules = createSchemaFieldRule(confirmSignUpSchema);

/**
 * ConfirmSignUp form component - handles form logic and UI
 * Supports email in URL query parameters
 */
export const ConfirmSignUpForm = () => {
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<ConfirmSignUpDto>();

  // Get email from URL
  const email = searchParams.get('email') || '';

  const confirmSignUpMutation = useConfirmSignUp();
  const resendCodeMutation = useResendConfirmationCode();

  const handleConfirm = (values: ConfirmSignUpDto) => {
    confirmSignUpMutation.mutate(values);
  };

  const handleResendCode = () => {
    const username = form.getFieldValue('username');
    if (!username) {
      // The hook will handle the error message
      return;
    }

    resendCodeMutation.mutate({ username });
  };

  return (
    <ResponsiveContainer maxWidth="400px" padding="24px">
      <Card
        style={{
          width: '100%',
          boxShadow: 'none',
          border: '1px solid var(--ant-color-border)',
          backgroundColor: 'transparent',
        }}
      >
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
