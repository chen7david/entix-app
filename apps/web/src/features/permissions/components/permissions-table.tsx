import React from 'react';
import { Button, Space, Tag, Tooltip, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import type { Permission } from '@repo/entix-sdk';
import { ResponsiveTable } from '@/shared/components/ui/responsive-table';

type PermissionsTableProps = {
  permissions: Permission[];
  loading: boolean;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
  onView: (permission: Permission) => void;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
};

/**
 * Table component for displaying permissions with actions
 */
export const PermissionsTable: React.FC<PermissionsTableProps> = ({
  permissions,
  loading,
  onEdit,
  onDelete,
  onView,
  canEdit,
  canDelete,
  canView,
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <Avatar icon={<LockOutlined />} />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'permissionCode',
      key: 'permissionCode',
      render: (code: number) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) => description || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Permission) => (
        <Space size="small">
          {canView && (
            <Tooltip title="View Details">
              <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record)} size="small" />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Edit Permission">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small" />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete Permission">
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} size="small" />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={permissions}
      loading={loading}
      rowKey="id"
      minWidth={800}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} permissions`,
      }}
    />
  );
};
