import { Table, Button, Space, Tag, Avatar, Typography, Tooltip } from 'antd';
import { UserOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { usePermissions } from '@/features/auth/hooks/use-auth';
import { PermissionCode } from '@repo/entix-sdk';
import type { User } from '@repo/entix-sdk';

const { Text } = Typography;

type UsersTableProps = {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
};

/**
 * UsersTable component for displaying users in a table format
 */
export const UsersTable = ({ users, loading, onEdit, onView }: UsersTableProps) => {
  const { hasPermission } = usePermissions();

  // Table columns configuration
  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{
              backgroundColor: !record.disabledAt ? '#0066ff' : '#a1a1aa',
            }}
          >
            {record.username.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, color: '#0066ff' }}>{record.username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: User) => (
        <Tag color={!record.disabledAt ? 'green' : 'red'}>{!record.disabledAt ? 'Active' : 'Disabled'}</Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Disabled', value: false },
      ],
      onFilter: (value: boolean | React.Key, record: User) => !record.disabledAt === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
      sorter: (a: User, b: User) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record)} size="small" />
          </Tooltip>
          {hasPermission(PermissionCode.GET_USER) && (
            <Tooltip title="Edit User">
              <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} size="small" />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
      }}
      scroll={{ x: 800 }}
    />
  );
};
