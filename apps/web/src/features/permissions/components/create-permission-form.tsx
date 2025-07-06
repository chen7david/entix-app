import React from 'react';
import { Form, Input, InputNumber, Button, Space } from 'antd';
import type { CreatePermissionParamsDto } from '@repo/entix-sdk';

type CreatePermissionFormProps = {
  onSubmit: (values: CreatePermissionParamsDto) => void;
  onCancel: () => void;
  loading: boolean;
  nextPermissionCode: number;
};

/**
 * Form component for creating new permissions
 */
export const CreatePermissionForm: React.FC<CreatePermissionFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  nextPermissionCode,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string; permissionCode: number; description?: string }) => {
    const permissionData: CreatePermissionParamsDto = {
      name: values.name,
      permissionCode: values.permissionCode,
      description: values.description,
    };
    await onSubmit(permissionData);
    form.resetFields();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
      initialValues={{
        permissionCode: nextPermissionCode,
      }}
    >
      <Form.Item
        name="name"
        label="Permission Name"
        rules={[
          { required: true, message: 'Please enter a permission name' },
          { min: 2, message: 'Permission name must be at least 2 characters' },
          { max: 50, message: 'Permission name must be less than 50 characters' },
        ]}
      >
        <Input placeholder="Enter permission name" />
      </Form.Item>

      <Form.Item
        name="permissionCode"
        label="Permission Code"
        rules={[
          { required: true, message: 'Please enter a permission code' },
          { type: 'number', min: 1, message: 'Permission code must be a positive number' },
        ]}
      >
        <InputNumber placeholder="Enter permission code" min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ max: 200, message: 'Description must be less than 200 characters' }]}
      >
        <Input.TextArea placeholder="Enter permission description (optional)" rows={3} maxLength={200} showCount />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Permission
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
