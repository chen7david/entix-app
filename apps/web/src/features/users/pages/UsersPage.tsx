import { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Typography,
  Row,
  Col,
  Select,
  Modal,
  Form,
  message,
  Tooltip,
  Badge,
  Descriptions,
  Drawer,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import { usePermissions } from '@/features/auth/hooks/use-auth';
import { PermissionCode } from '@repo/entix-sdk';
import type { User, CreateUserParamsDto, UpdateUserParamsDto } from '@repo/entix-sdk';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * UsersPage component for managing users
 */
export default function UsersPage() {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Hooks
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Queries
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.users.getUsers(),
    enabled: hasPermission(PermissionCode.GET_USERS),
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', selectedUser?.id],
    queryFn: () => (selectedUser ? apiClient.users.getUserRoles(selectedUser.id) : Promise.resolve([])),
    enabled: !!selectedUser && hasPermission(PermissionCode.GET_USER_ROLES),
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserParamsDto) => apiClient.users.createUser(userData),
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: () => {
      message.error('Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserParamsDto }) =>
      apiClient.users.updateUser(id, userData),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedUser(null);
    },
    onError: () => {
      message.error('Failed to update user');
    },
  });

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

  // Handle user creation
  const handleCreateUser = async (values: {
    username: string;
    email: string;
    password: string;
    invitationCode: string;
  }) => {
    try {
      const userData: CreateUserParamsDto = {
        username: values.username,
        email: values.email,
        password: values.password,
        invitationCode: values.invitationCode,
      };

      await createUserMutation.mutateAsync(userData);
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  // Handle user update
  const handleUpdateUser = async (values: { username: string; password: string }) => {
    if (!selectedUser) return;

    try {
      const userData: UpdateUserParamsDto = {
        username: values.username,
        password: values.password,
      };

      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        userData,
      });
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      username: user.username,
    });
    setIsEditModalVisible(true);
  };

  // Handle view user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailDrawerVisible(true);
  };

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
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewUser(record)} />
          </Tooltip>
          {hasPermission(PermissionCode.GET_USER) && (
            <Tooltip title="Edit User">
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission(PermissionCode.GET_USERS)) {
    return (
      <Card style={{ boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#d4d4d8' }} />
          <Title level={4} style={{ marginTop: '16px', color: '#71717a' }}>
            Access Denied
          </Title>
          <Text type="secondary">You don't have permission to view users.</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--ant-color-bg-layout)', minHeight: '100vh' }}>
      <Card
        title="Users Management"
        style={{
          marginBottom: '24px',
          boxShadow: 'none',
          border: '1px solid var(--ant-color-border)',
        }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetchUsers()} loading={usersLoading}>
              Refresh
            </Button>
            {hasPermission(PermissionCode.GET_USER) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
                Add User
              </Button>
            )}
          </Space>
        }
      >
        {/* Filters */}
        <Card style={{ marginBottom: '24px', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search users..."
                allowClear
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filter by status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%' }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Disabled</Option>
              </Select>
            </Col>
            <Col xs={24} md={10}>
              <Space>
                <Text type="secondary">
                  {filteredUsers.length} of {users.length} users
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={usersLoading}
          pagination={{
            total: filteredUsers.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="Create New User"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
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
              <Button
                onClick={() => {
                  setIsCreateModalVisible(false);
                  createForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={createUserMutation.isPending}>
                Create User
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setSelectedUser(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateUser}>
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
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={updateUserMutation.isPending}>
                Update User
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* User Details Drawer */}
      <Drawer
        title="User Details"
        open={isDetailDrawerVisible}
        onClose={() => {
          setIsDetailDrawerVisible(false);
          setSelectedUser(null);
        }}
        width={500}
      >
        {selectedUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: !selectedUser.disabledAt ? '#0066ff' : '#a1a1aa',
                }}
              >
                {selectedUser.username.charAt(0)}
              </Avatar>
              <Title level={4} style={{ margin: '16px 0 8px' }}>
                {selectedUser.username}
              </Title>
              <Badge
                status={!selectedUser.disabledAt ? 'success' : 'default'}
                text={!selectedUser.disabledAt ? 'Active' : 'Disabled'}
              />
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Username">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={!selectedUser.disabledAt ? 'success' : 'default'}
                  text={!selectedUser.disabledAt ? 'Active' : 'Disabled'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Created">{new Date(selectedUser.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedUser.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {userRoles.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>
                  Assigned Roles
                </Title>
                <Space wrap>
                  {userRoles.map((role: { id: string; name: string }) => (
                    <Tag key={role.id} color="blue">
                      {role.name}
                    </Tag>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
