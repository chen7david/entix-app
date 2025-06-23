import { Table, Tag, Avatar, Typography, Tooltip, Button, Space } from 'antd';
import type { Breakpoint } from 'antd';
import { UserOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { User } from '@shared/types';
import { usePermissions } from '@shared/hooks';
import { PermissionCode } from '@shared/types';

const { Text } = Typography;

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
}

/**
 * UsersTable Component
 * Displays users in a responsive table with actions
 */
export const UsersTable = ({ users, loading, onEdit, onView }: UsersTableProps) => {
  const { hasPermission } = usePermissions();

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            <UserOutlined />
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: User) => (
        <Tag color={record.disabledAt ? 'red' : 'green'}>{record.disabledAt ? 'Inactive' : 'Active'}</Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value: unknown, record: User) => {
        if (value === 'active') return !record.disabledAt;
        if (value === 'inactive') return !!record.disabledAt;
        return true;
      },
    },
    {
      title: 'Created',
      key: 'created',
      render: (_: unknown, record: User) => (
        <Text type="secondary">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown'}</Text>
      ),
      responsive: ['lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          {hasPermission(PermissionCode.GET_USER) && (
            <Tooltip title="Edit user">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
          )}
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as Breakpoint[],
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        total: users.length,
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
      }}
      scroll={{ x: 800 }}
      size="small"
    />
  );
};
