import { Form, Input, Row, Col, Button } from 'antd';
import type { UpdateUserParamsDto, User } from '@repo/entix-sdk';

type EditUserFormProps = {
  user: User;
  onSubmit: (values: UpdateUserParamsDto) => void;
  onCancel: () => void;
  loading?: boolean;
};

/**
 * EditUser form component for updating existing users
 */
export const EditUserForm = ({ user, onSubmit, onCancel, loading = false }: EditUserFormProps) => {
  const [form] = Form.useForm<UpdateUserParamsDto>();

  const handleSubmit = (values: UpdateUserParamsDto) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        username: user.username,
      }}
    >
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
        name="password"
        label="New Password (optional)"
        rules={[{ min: 8, message: 'Password must be at least 8 characters' }]}
      >
        <Input.Password placeholder="Enter new password (leave blank to keep current)" />
      </Form.Item>

      <Row justify="end" gutter={16}>
        <Col>
          <Button onClick={handleCancel}>Cancel</Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update User
          </Button>
        </Col>
      </Row>
    </Form>
  );
};
