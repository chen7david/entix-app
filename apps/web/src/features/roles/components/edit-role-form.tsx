import React, { useEffect } from 'react';
import { Form, Input, Button, Space } from 'antd';
import type { Role, UpdateRoleParamsDto } from '@repo/entix-sdk';

type EditRoleFormProps = {
  role: Role;
  onSubmit: (values: UpdateRoleParamsDto) => void;
  onCancel: () => void;
  loading: boolean;
};

/**
 * Form component for editing existing roles
 */
export const EditRoleForm: React.FC<EditRoleFormProps> = ({ role, onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      name: role.name,
      description: role.description,
    });
  }, [role, form]);

  const handleSubmit = async (values: { name: string; description?: string }) => {
    const roleData: UpdateRoleParamsDto = {
      description: values.description,
    };
    await onSubmit(roleData);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
      <Form.Item
        name="name"
        label="Role Name"
        rules={[
          { required: true, message: 'Please enter a role name' },
          { min: 2, message: 'Role name must be at least 2 characters' },
          { max: 50, message: 'Role name must be less than 50 characters' },
        ]}
      >
        <Input placeholder="Enter role name" disabled />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ max: 200, message: 'Description must be less than 200 characters' }]}
      >
        <Input.TextArea placeholder="Enter role description (optional)" rows={3} maxLength={200} showCount />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Update Role
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
