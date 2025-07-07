import React, { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  message,
  Tooltip,
  Typography,
  Row,
  Col,
  Drawer,
  Descriptions,
  Transfer,
  Divider,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  LockOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { usePermissions } from '@/hooks/auth.hook';
import { PermissionCode } from '@repo/entix-sdk';
import type { Role, CreateRoleParamsDto, UpdateRoleParamsDto } from '@repo/entix-sdk';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

/**
 * Roles management page with CRUD operations and permission assignment
 */
export default function RolesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

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

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.permissions.getPermissions(),
    enabled: hasPermission(PermissionCode.GET_PERMISSIONS),
  });

  const { data: rolePermissions = [], refetch: refetchRolePermissions } = useQuery({
    queryKey: ['role-permissions', selectedRole?.id],
    queryFn: () => (selectedRole ? apiClient.roles.getRolePermissions(selectedRole.id) : Promise.resolve([])),
    enabled: !!selectedRole && hasPermission(PermissionCode.GET_ROLE_PERMISSIONS),
  });

  const { data: roleUsers = [] } = useQuery({
    queryKey: ['role-users', selectedRole?.id],
    queryFn: () => (selectedRole ? apiClient.roles.getRoleUsers(selectedRole.id) : Promise.resolve([])),
    enabled: !!selectedRole && hasPermission(PermissionCode.GET_ROLE_USERS),
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (roleData: CreateRoleParamsDto) => apiClient.roles.createRole(roleData),
    onSuccess: () => {
      message.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(
        (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to create role',
      );
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleData }: { id: string; roleData: UpdateRoleParamsDto }) =>
      apiClient.roles.updateRole(id, roleData),
    onSuccess: () => {
      message.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedRole(null);
    },
    onError: (error: Error) => {
      message.error(
        (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to update role',
      );
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiClient.roles.deleteRole(roleId),
    onSuccess: () => {
      message.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      message.error(
        (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to delete role',
      );
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient.rolePermissions.createRolePermission({ roleId, permissionId }),
    onSuccess: () => {
      message.success('Permission assigned successfully');
      refetchRolePermissions();
    },
    onError: (error: Error) => {
      message.error(
        (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to assign permission',
      );
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiClient.rolePermissions.deleteRolePermission({ roleId, permissionId }),
    onSuccess: () => {
      message.success('Permission removed successfully');
      refetchRolePermissions();
    },
    onError: (error: Error) => {
      message.error(
        (error as unknown as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to remove permission',
      );
    },
  });

  // Filter roles based on search
  const filteredRoles = roles.filter(
    role =>
      !searchTerm ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle role creation
  const handleCreateRole = async (values: { name: string; description?: string }) => {
    try {
      const roleData: CreateRoleParamsDto = {
        name: values.name,
        description: values.description,
      };

      await createRoleMutation.mutateAsync(roleData);
    } catch (error) {
      console.error('Create role error:', error);
    }
  };

  // Handle role update
  const handleUpdateRole = async (values: { name: string; description?: string }) => {
    if (!selectedRole) return;

    try {
      const roleData: UpdateRoleParamsDto = {
        description: values.description,
      };

      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        roleData,
      });
    } catch (error) {
      console.error('Update role error:', error);
    }
  };

  // Handle role deletion
  const handleDeleteRole = (role: Role) => {
    Modal.confirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete "${role.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteRoleMutation.mutate(role.id),
    });
  };

  // Handle edit role
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    editForm.setFieldsValue({
      name: role.name,
      description: role.description,
    });
    setIsEditModalVisible(true);
  };

  // Handle view role details
  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setIsDetailDrawerVisible(true);
  };

  // Handle manage permissions
  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalVisible(true);
  };

  // Handle permission transfer change
  const handlePermissionTransferChange = (targetKeys: string[]) => {
    if (!selectedRole) return;

    const currentPermissionIds = rolePermissions.map(p => p.id);
    const toAdd = targetKeys.filter(id => !currentPermissionIds.includes(id));
    const toRemove = currentPermissionIds.filter(id => !targetKeys.includes(id));

    // Add new permissions
    toAdd.forEach(permissionId => {
      assignPermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId,
      });
    });

    // Remove permissions
    toRemove.forEach(permissionId => {
      removePermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId,
      });
    });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, record: Role) => {
        const name = record.name;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar size="small" style={{ backgroundColor: '#0066ff' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 500, color: '#0066ff' }}>{name}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
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
      render: (description: string) => description || '-',
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Active</Tag>,
      filters: [{ text: 'Active', value: true }],
      onFilter: () => true, // All roles are active since there's no isActive field
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date | null) => (date ? new Date(date).toLocaleDateString() : '-'),
      sorter: (a: Role, b: Role) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      },
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_: unknown, record: Role) => (
        <Button type="link" icon={<LockOutlined />} onClick={() => handleManagePermissions(record)}>
          Manage Permissions
        </Button>
      ),
    },
    {
      title: 'Users',
      key: 'users',
      render: (_: unknown, record: Role) => (
        <Button type="link" icon={<TeamOutlined />} onClick={() => handleViewRole(record)}>
          View Users
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewRole(record)} />
          </Tooltip>
          {hasPermission(PermissionCode.UPDATE_ROLE) && (
            <Tooltip title="Edit Role">
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEditRole(record)} />
            </Tooltip>
          )}
          {hasPermission(PermissionCode.DELETE_ROLE) && (
            <Tooltip title="Delete Role">
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRole(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission(PermissionCode.GET_ROLES)) {
    return (
      <Card style={{ boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#d4d4d8' }} />
          <Title level={4} style={{ marginTop: '16px', color: '#71717a' }}>
            Access Denied
          </Title>
          <Text type="secondary">You don't have permission to view roles.</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--ant-color-bg-layout)', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Roles Management
          </Title>
          <Text type="secondary">Manage roles, permissions, and user assignments</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetchRoles()} loading={rolesLoading}>
              Refresh
            </Button>
            {hasPermission(PermissionCode.CREATE_ROLE) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
                Add Role
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
          }}
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
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 3, message: 'Role name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Enter role description" rows={3} maxLength={500} showCount />
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
              <Button type="primary" htmlType="submit" loading={createRoleMutation.isPending}>
                Create Role
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title="Edit Role"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setSelectedRole(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateRole}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 3, message: 'Role name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Enter role description" rows={3} maxLength={500} showCount />
          </Form.Item>

          <Row justify="end" gutter={16}>
            <Col>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setSelectedRole(null);
                }}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={updateRoleMutation.isPending}>
                Update Role
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Permissions Management Modal */}
      <Modal
        title={`Manage Permissions - ${selectedRole?.name}`}
        open={isPermissionsModalVisible}
        onCancel={() => {
          setIsPermissionsModalVisible(false);
          setSelectedRole(null);
        }}
        footer={null}
        width={800}
      >
        {selectedRole && (
          <Transfer
            dataSource={permissions.map(p => ({
              key: p.id,
              title: p.name,
              description: p.description || undefined,
            }))}
            targetKeys={rolePermissions.map(p => p.id)}
            onChange={(targetKeys: React.Key[]) => handlePermissionTransferChange(targetKeys as string[])}
            render={item => (
              <div>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                {item.description && <div style={{ fontSize: '12px', color: '#71717a' }}>{item.description}</div>}
              </div>
            )}
            titles={['Available Permissions', 'Assigned Permissions']}
            showSearch
            filterOption={(inputValue, option) => {
              const title = option.title?.toLowerCase() || '';
              const description = option.description?.toLowerCase() || '';
              return title.includes(inputValue.toLowerCase()) || description.includes(inputValue.toLowerCase());
            }}
            style={{ marginBottom: '16px' }}
          />
        )}
      </Modal>

      {/* Role Details Drawer */}
      <Drawer
        title="Role Details"
        open={isDetailDrawerVisible}
        onClose={() => {
          setIsDetailDrawerVisible(false);
          setSelectedRole(null);
        }}
        width={600}
      >
        {selectedRole && (
          <div>
            <Descriptions column={1} bordered style={{ marginBottom: '24px' }}>
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
              {rolePermissions.length > 0 ? (
                <Space wrap>
                  {rolePermissions.map(permission => (
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
              {roleUsers.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {roleUsers.map(user => (
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
          </div>
        )}
      </Drawer>
    </div>
  );
}
