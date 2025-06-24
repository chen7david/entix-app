import { useState } from 'react';
import { Table, Input, Space, Avatar, Typography, Row, Col, Select, Tooltip, Badge } from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { User } from '@repo/entix-sdk';
import { useUsers } from '../hooks/use-users';
import { usePermissions } from '@features/auth';
import { PermissionCode } from '@repo/entix-sdk';
import { Button, LoadingSpinner } from '@shared/components/ui';
import { ResponsiveContainer } from '@shared/components/layout';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * Users table filters component
 */
const UsersTableFilters = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  onRefresh,
  isLoading,
  onCreateUser,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onCreateUser: () => void;
}) => {
  const { hasPermission } = usePermissions();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
      <Col xs={24} sm={12} md={8}>
        <Search
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Select value={selectedStatus} onChange={setSelectedStatus} style={{ width: '100%' }}>
          <Option value="all">All Users</Option>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Col>
      <Col xs={24} sm={24} md={8}>
        <Space>
          {hasPermission(PermissionCode.GET_USERS) && (
            <Button variant="primary" icon={<PlusOutlined />} onClick={onCreateUser}>
              Add User
            </Button>
          )}
          <Button variant="secondary" icon={<ReloadOutlined />} onClick={onRefresh} loading={isLoading}>
            Refresh
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

/**
 * Users table component - handles data display and user interactions
 */
export const UsersTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { users, isLoading, refetchUsers } = useUsers();
  const { hasPermission } = usePermissions();

  // Filter users based on search and status
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      !searchTerm ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && !user.disabledAt) ||
      (selectedStatus === 'inactive' && user.disabledAt);

    return matchesSearch && matchesStatus;
  });

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
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: User) => (
        <Badge status={record.disabledAt ? 'error' : 'success'} text={record.disabledAt ? 'Inactive' : 'Active'} />
      ),
    },
    {
      title: 'Created',
      key: 'createdAt',
      render: (_: unknown, record: User) => (
        <Text type="secondary">{new Date(record.createdAt).toLocaleDateString()}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space size="small">
          {hasPermission(PermissionCode.GET_USER) && (
            <Tooltip title="View Details">
              <Button
                variant="ghost"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => console.log('View user:', record.id)}
              />
            </Tooltip>
          )}
          {hasPermission(PermissionCode.GET_USERS) && (
            <Tooltip title="Edit User">
              <Button
                variant="ghost"
                size="small"
                icon={<EditOutlined />}
                onClick={() => console.log('Edit user:', record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const handleCreateUser = () => {
    console.log('Create user');
  };

  return (
    <ResponsiveContainer>
      <div>
        <UsersTableFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          onRefresh={refetchUsers}
          isLoading={isLoading}
          onCreateUser={handleCreateUser}
        />

        <LoadingSpinner spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            }}
          />
        </LoadingSpinner>
      </div>
    </ResponsiveContainer>
  );
};
