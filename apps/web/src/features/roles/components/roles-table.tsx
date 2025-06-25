import React from 'react';
import { Button, Space, Tag, Tooltip, Avatar } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  EyeOutlined,
  UserOutlined,
  LockOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Role } from '@repo/entix-sdk';
import { ResponsiveTable } from '@/shared/components/ui/responsive-table';

type RolesTableProps = {
  roles: Role[];
  loading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onView: (role: Role) => void;
  onManagePermissions: (role: Role) => void;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canManagePermissions: boolean;
};

/**
 * Table component for displaying roles with actions
 */
export const RolesTable: React.FC<RolesTableProps> = ({
  roles,
  loading,
  onEdit,
  onDelete,
  onView,
  onManagePermissions,
  canEdit,
  canDelete,
  canView,
  canManagePermissions,
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <Avatar icon={<TeamOutlined />} />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string | null) => description || '-',
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (userCount: number) => (
        <Tag icon={<UserOutlined />} color="blue">
          {userCount || 0} users
        </Tag>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissionCount',
      key: 'permissionCount',
      render: (permissionCount: number) => (
        <Tag icon={<LockOutlined />} color="green">
          {permissionCount || 0} permissions
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <Space size="small">
          {canView && (
            <Tooltip title="View Details">
              <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record)} size="small" />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Edit Role">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small" />
            </Tooltip>
          )}
          {canManagePermissions && (
            <Tooltip title="Manage Permissions">
              <Button type="text" icon={<SafetyOutlined />} onClick={() => onManagePermissions(record)} size="small" />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete Role">
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
      dataSource={roles}
      loading={loading}
      rowKey="id"
      minWidth={1000}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`,
      }}
    />
  );
};
