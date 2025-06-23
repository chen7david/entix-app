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
  Modal,
  Form,
  Tooltip,
  Badge,
  Descriptions,
  Drawer,
  Divider,
  List,
  Empty,
} from 'antd';
import type { Breakpoint } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  LockOutlined,
  DeleteOutlined,
  UserOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import { usePermissions } from '@/hooks/auth.hook';
import { PermissionCode } from '@repo/entix-sdk';
import type { Role, Permission, User, CreateRoleParamsDto, UpdateRoleParamsDto } from '@repo/entix-sdk';
import { App } from 'antd';
import { PageLoading } from '@/components/LoadingSpinner';
import { PageContainer } from '@/components/ResponsiveContainer';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

type ErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

/**
 * RolesPage component for managing roles
 */
export default function RolesPage() {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Forms
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Hooks
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { message } = App.useApp();

  // Queries
  const {
    data: roles = [],
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.roles.getRoles(),
    enabled: hasPermission(PermissionCode.GET_ROLES),
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.permissions.getPermissions(),
    enabled: hasPermission(PermissionCode.GET_PERMISSIONS),
  });

  const { data: rolePermissions = [], isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['role-permissions', selectedRole?.id],
    queryFn: () => {
      console.log('🔍 Fetching role permissions for role:', selectedRole?.id, selectedRole?.name);
      return apiClient.roles.getRolePermissions(selectedRole!.id.toString());
    },
    enabled: !!selectedRole && hasPermission(PermissionCode.GET_ROLE_PERMISSIONS),
  });

  const { data: roleUsers = [], isLoading: roleUsersLoading } = useQuery({
    queryKey: ['role-users', selectedRole?.id],
    queryFn: () => apiClient.roles.getRoleUsers(selectedRole!.id.toString()),
    enabled: !!selectedRole,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: CreateRoleParamsDto) => {
      return apiClient.roles.createRole(roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role created successfully');
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: (error: ErrorResponse) => {
      message.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: UpdateRoleParamsDto & { id: string }) => {
      return apiClient.roles.updateRole(id, roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role updated successfully');
      setIsEditModalVisible(false);
      setSelectedRole(null);
      editForm.resetFields();
    },
    onError: (error: ErrorResponse) => {
      message.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiClient.roles.deleteRole(roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      message.success('Role deleted successfully');
    },
    onError: (error: ErrorResponse) => {
      message.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: async (params: { roleId: string; permissionId: string }) => {
      return apiClient.rolePermissions.createRolePermission({
        roleId: params.roleId,
        permissionId: params.permissionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole?.id] });
      message.success('Permission assigned successfully');
    },
    onError: (error: ErrorResponse) => {
      message.error(error.response?.data?.message || 'Failed to assign permission');
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: async (params: { roleId: string; permissionId: string }) => {
      return apiClient.rolePermissions.deleteRolePermission({
        roleId: params.roleId,
        permissionId: params.permissionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', selectedRole?.id] });
      message.success('Permission removed successfully');
    },
    onError: (error: ErrorResponse) => {
      message.error(error.response?.data?.message || 'Failed to remove permission');
    },
  });

  // Filter roles based on search
  const filteredRoles = roles.filter(
    (role: Role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Handlers
  const handleCreateRole = async (values: { name: string; description?: string }) => {
    createRoleMutation.mutate(values);
  };

  const handleUpdateRole = async (values: { name: string; description?: string }) => {
    if (selectedRole) {
      updateRoleMutation.mutate({
        id: selectedRole.id,
        ...values,
      });
    }
  };

  const handleDeleteRole = (role: Role) => {
    Modal.confirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete the role "${role.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteRoleMutation.mutate(role.id),
    });
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    editForm.setFieldsValue({
      name: role.name,
      description: role.description,
    });
    setIsEditModalVisible(true);
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setIsDetailDrawerVisible(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalVisible(true);
  };

  const handleAssignPermission = (permissionId: string) => {
    if (selectedRole) {
      assignPermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId,
      });
    }
  };

  const handleRemovePermission = (permissionId: string) => {
    if (selectedRole) {
      removePermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId,
      });
    }
  };

  // Get available permissions for assignment
  const assignedPermissionIds = (rolePermissions as Permission[]).map((p: Permission) => p.id);
  const availablePermissions = permissions.filter((p: Permission) => !assignedPermissionIds.includes(p.id));

  // Debug logs
  console.log('🔧 Debug - selectedRole:', selectedRole);
  console.log('🔧 Debug - hasPermission(GET_ROLE_PERMISSIONS):', hasPermission(PermissionCode.GET_ROLE_PERMISSIONS));
  console.log('🔧 Debug - rolePermissions:', rolePermissions);
  console.log('🔧 Debug - rolePermissionsLoading:', rolePermissionsLoading);
  console.log(
    '🔧 Debug - assignedPermissionIds:',
    (rolePermissions as Permission[]).map((p: Permission) => p.id),
  );
  console.log('🔧 Debug - availablePermissions count:', availablePermissions.length);

  // Table columns configuration with mobile responsiveness
  const columns = [
    {
      title: 'Role',
      key: 'role',
      width: 200,
      fixed: 'left' as const,
      render: (_: unknown, record: Role) => {
        const name = record.name;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar size="small" style={{ backgroundColor: '#0066ff' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 500, color: '#0066ff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <Text type="secondary" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {record.description || 'No description'}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description: string) => (
        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{description || '-'}</div>
      ),
      responsive: ['lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: () => <Tag color="green">Active</Tag>,
      responsive: ['md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: Date | null) => (date ? new Date(date).toLocaleDateString() : '-'),
      sorter: (a: Role, b: Role) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      },
      responsive: ['xl'] as Breakpoint[],
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Role) => (
        <Space size="small" className="responsive-button-group">
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewRole(record)} />
          </Tooltip>
          <Tooltip title="Manage Permissions">
            <Button type="text" size="small" icon={<LockOutlined />} onClick={() => handleManagePermissions(record)} />
          </Tooltip>
          {hasPermission(PermissionCode.UPDATE_ROLE) && (
            <Tooltip title="Edit Role">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditRole(record)} />
            </Tooltip>
          )}
          {hasPermission(PermissionCode.DELETE_ROLE) && (
            <Tooltip title="Delete Role">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteRole(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission(PermissionCode.GET_ROLES)) {
    return (
      <PageContainer>
        <Card style={{ boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <SafetyOutlined style={{ fontSize: '48px', color: '#d4d4d8' }} />
            <Title level={4} style={{ marginTop: '16px', color: '#71717a' }}>
              Access Denied
            </Title>
            <Text type="secondary">You don't have permission to view roles.</Text>
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (rolesLoading) {
    return <PageLoading tip="Loading roles..." />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }} className="mobile-stack">
        <Col xs={24} lg={12}>
          <Title level={2} style={{ margin: 0 }}>
            Roles Management
          </Title>
          <Text type="secondary">Manage roles, permissions, and user assignments</Text>
        </Col>
        <Col xs={24} lg={12} style={{ textAlign: 'right' }}>
          <Space size="small" className="responsive-button-group">
            <Button icon={<ReloadOutlined />} onClick={() => refetchRoles()} loading={rolesLoading} size="small">
              <span className="desktop-only">Refresh</span>
            </Button>
            {hasPermission(PermissionCode.CREATE_ROLE) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)} size="small">
                <span className="desktop-only">Add Role</span>
                <span className="mobile-only">Add</span>
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: '24px', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search roles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary">
              {filteredRoles.length} of {roles.length} roles
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Roles Table */}
      <Card style={{ boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <Table
          columns={columns}
          dataSource={filteredRoles}
          rowKey="id"
          loading={rolesLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} roles`,
            responsive: true,
          }}
          scroll={{ x: 800, y: 400 }}
          size="middle"
        />
      </Card>

      {/* Create Role Modal */}
      <Modal
        title="Create New Role"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 2, message: 'Role name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Enter role description" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createRoleMutation.isPending}>
                Create Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title="Edit Role"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedRole(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateRole}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 2, message: 'Role name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Enter role description" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsEditModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updateRoleMutation.isPending}>
                Update Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Management Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LockOutlined />
            <span>Manage Permissions - {selectedRole?.name}</span>
          </div>
        }
        open={isPermissionsModalVisible}
        onCancel={() => {
          setIsPermissionsModalVisible(false);
          setSelectedRole(null);
        }}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Button onClick={() => setIsPermissionsModalVisible(false)}>Close</Button>
          </div>
        }
        width={1000}
        style={{
          maxWidth: 'calc(100vw - 32px)',
          top: 20,
        }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: '24px',
          },
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Available Permissions</span>
                  <Badge count={availablePermissions.length} color="#108ee9" />
                </div>
              }
              size="small"
              style={{ height: '500px' }}
            >
              {permissionsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>Loading permissions...</Text>
                </div>
              ) : availablePermissions.length > 0 ? (
                <List
                  size="small"
                  dataSource={availablePermissions}
                  style={{ height: '420px', overflowY: 'auto' }}
                  renderItem={(permission: Permission) => (
                    <List.Item
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--ant-color-border)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'var(--ant-color-fill-tertiary)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      actions={[
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleAssignPermission(permission.id)}
                          loading={assignPermissionMutation.isPending}
                          icon={<PlusOutlined />}
                        >
                          Assign
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<div style={{ fontWeight: 500, color: 'var(--ant-color-text)' }}>{permission.name}</div>}
                        description={
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--ant-color-text-secondary)',
                              marginTop: '4px',
                            }}
                          >
                            {permission.description || 'No description available'}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="All permissions are assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Assigned Permissions</span>
                  <Badge count={(rolePermissions as Permission[]).length} color="#52c41a" />
                </div>
              }
              size="small"
              style={{ height: '500px' }}
            >
              {rolePermissionsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text>Loading assigned permissions...</Text>
                </div>
              ) : (rolePermissions as Permission[]).length > 0 ? (
                <List
                  size="small"
                  dataSource={rolePermissions as Permission[]}
                  style={{ height: '420px', overflowY: 'auto' }}
                  renderItem={(permission: Permission) => (
                    <List.Item
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--ant-color-border)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'var(--ant-color-fill-tertiary)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      actions={[
                        <Button
                          danger
                          size="small"
                          onClick={() => handleRemovePermission(permission.id)}
                          loading={removePermissionMutation.isPending}
                          icon={<DeleteOutlined />}
                        >
                          Remove
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<div style={{ fontWeight: 500, color: 'var(--ant-color-text)' }}>{permission.name}</div>}
                        description={
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--ant-color-text-secondary)',
                              marginTop: '4px',
                            }}
                          >
                            {permission.description || 'No description available'}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No permissions assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* Role Details Drawer */}
      <Drawer
        title="Role Details"
        open={isDetailDrawerVisible}
        onClose={() => {
          setIsDetailDrawerVisible(false);
          setSelectedRole(null);
        }}
        width={window.innerWidth < 768 ? '100%' : 600}
      >
        {selectedRole && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Role Name">{selectedRole.name}</Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedRole.description || 'No description provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">Active</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {selectedRole.createdAt ? new Date(selectedRole.createdAt).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedRole.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Assigned Permissions</Title>
            <div style={{ marginBottom: '24px' }}>
              {rolePermissionsLoading ? (
                <Text>Loading permissions...</Text>
              ) : (rolePermissions as Permission[]).length > 0 ? (
                <Space wrap>
                  {(rolePermissions as Permission[]).map((permission: Permission) => (
                    <Tag key={permission.id} color="blue">
                      {permission.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No permissions assigned</Text>
              )}
            </div>

            <Divider />

            <Title level={5}>Users with this Role</Title>
            <div>
              {roleUsersLoading ? (
                <Text>Loading users...</Text>
              ) : roleUsers.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {roleUsers.map((user: User) => (
                    <div key={user.id} style={{ padding: '8px', border: '1px solid #e4e4e7', borderRadius: '8px' }}>
                      <Space>
                        <UserOutlined />
                        <div>
                          <div style={{ fontWeight: 500 }}>{user.username}</div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {user.email}
                          </Text>
                        </div>
                      </Space>
                    </div>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No users assigned to this role</Text>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <Space style={{ width: '100%' }} direction="vertical">
                <Button type="primary" block onClick={() => handleManagePermissions(selectedRole)}>
                  Manage Permissions
                </Button>
                {hasPermission(PermissionCode.UPDATE_ROLE) && (
                  <Button block onClick={() => handleEditRole(selectedRole)}>
                    Edit Role
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
