import { Button, Card, Form, Input, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { createSchemaFieldRule } from 'antd-zod';
import { loginSchema, type LoginDto } from '@repo/entix-sdk';

const { Title, Text } = Typography;

// Create rules from Zod schema
const rules = createSchemaFieldRule(loginSchema);

export const LoginPage = () => {
  const [form] = Form.useForm<LoginDto>();

  const onSubmit = (values: LoginDto) => {
    console.log('Login submitted:', values);
    // TODO: API call
  };

  return (
    <Card className="w-full max-w-md rounded-2xl">
      <Title level={2} className="text-center mb-6">
        Login
      </Title>

      <Form form={form} layout="vertical" onFinish={onSubmit} autoComplete="off" requiredMark={false}>
        <Form.Item name="username" label="Username" rules={[rules]}>
          <Input placeholder="Enter your username" />
        </Form.Item>

        <Form.Item name="password" label="Password" rules={[rules]}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <div className="flex justify-between text-sm mt-4 px-2">
        <Text>
          Don't have an account? <Link to="/register">Register</Link>
        </Text>
        <Text>
          <Link to="/password-reset">Forgot password?</Link>
        </Text>
      </div>
    </Card>
  );
};
