import { Form, Input, Row, Col, Button } from 'antd';
import type { CreateUserParamsDto } from '@repo/entix-sdk';

type CreateUserFormProps = {
  onSubmit: (values: CreateUserParamsDto) => void;
  onCancel: () => void;
  loading?: boolean;
};

/**
 * CreateUser form component for creating new users
 */
export const CreateUserForm = ({ onSubmit, onCancel, loading = false }: CreateUserFormProps) => {
  const [form] = Form.useForm<CreateUserParamsDto>();

  const handleSubmit = (values: CreateUserParamsDto) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        name="username"
        label="Username"
        rules={[
          { required: true, message: 'Please enter username' },
          { min: 3, message: 'Username must be at least 3 characters' },
        ]}
      >
        <Input placeholder="Enter username" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Please enter a valid email' },
        ]}
      >
        <Input placeholder="Enter email" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Temporary Password"
        rules={[
          { required: true, message: 'Please enter password' },
          { min: 8, message: 'Password must be at least 8 characters' },
        ]}
      >
        <Input.Password placeholder="Enter temporary password" />
      </Form.Item>

      <Form.Item
        name="invitationCode"
        label="Invitation Code"
        rules={[{ required: true, message: 'Please enter invitation code' }]}
      >
        <Input placeholder="Enter invitation code" />
      </Form.Item>

      <Row justify="end" gutter={16}>
        <Col>
          <Button onClick={handleCancel}>Cancel</Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create User
          </Button>
        </Col>
      </Row>
    </Form>
  );
};
