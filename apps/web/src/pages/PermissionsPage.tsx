import { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  Tooltip,
  Typography,
  Row,
  Col,
  Drawer,
  Descriptions,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import { usePermissions } from '@/hooks/auth.hook';
import { PermissionCode } from '@repo/entix-sdk';
import type { Permission, CreatePermissionParamsDto, UpdatePermissionParamsDto, Role } from '@repo/entix-sdk';
import { App } from 'antd';
import { PageLoading } from '@/components/LoadingSpinner';
import { PageContainer } from '@/components/ResponsiveContainer';

const { Title, Text } = Typography;
const { Search } = Input;

type ErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

/**
 * Permissions management page with CRUD operations
 */
export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { message: appMessage } = App.useApp();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Queries
  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.permissions.getPermissions(),
    enabled: hasPermission(PermissionCode.GET_PERMISSIONS),
  });

  const { data: permissionRoles = [] } = useQuery({
    queryKey: ['permission-roles', selectedPermission?.id],
    queryFn: () =>
      selectedPermission ? apiClient.permissions.getPermissionRoles(selectedPermission.id) : Promise.resolve([]),
    enabled: !!selectedPermission && hasPermission(PermissionCode.GET_PERMISSION_ROLES),
  });

  // Mutations
  const createPermissionMutation = useMutation({
    mutationFn: async (permissionData: CreatePermissionParamsDto) => {
      return apiClient.permissions.createPermission(permissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      appMessage.success('Permission created successfully');
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: (error: ErrorResponse) => {
      appMessage.error(error.response?.data?.message || 'Failed to create permission');
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, ...permissionData }: UpdatePermissionParamsDto & { id: string }) => {
      return apiClient.permissions.updatePermission(id, permissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      appMessage.success('Permission updated successfully');
      setIsEditModalVisible(false);
      setSelectedPermission(null);
      editForm.resetFields();
    },
    onError: (error: ErrorResponse) => {
      appMessage.error(error.response?.data?.message || 'Failed to update permission');
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      return apiClient.permissions.deletePermission(permissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      appMessage.success('Permission deleted successfully');
    },
    onError: (error: ErrorResponse) => {
      appMessage.error(error.response?.data?.message || 'Failed to delete permission');
    },
  });

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(
    (permission: Permission) =>
      !searchTerm ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permissionCode.toString().includes(searchTerm),
  );

  // Handle permission creation
  const handleCreatePermission = (values: CreatePermissionParamsDto) => {
    createPermissionMutation.mutate(values);
  };

  // Handle permission update
  const handleUpdatePermission = (values: UpdatePermissionParamsDto) => {
    if (selectedPermission) {
      updatePermissionMutation.mutate({
        id: selectedPermission.id,
        ...values,
      });
    }
  };

  // Handle permission deletion
  const handleDeletePermission = (permission: Permission) => {
    Modal.confirm({
      title: 'Delete Permission',
      content: `Are you sure you want to delete "${permission.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deletePermissionMutation.mutate(permission.id),
    });
  };

  // Handle edit permission
  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    editForm.setFieldsValue({
      name: permission.name,
      permissionCode: permission.permissionCode,
      description: permission.description,
    });
    setIsEditModalVisible(true);
  };

  // Handle view permission details
  const handleViewPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsDetailDrawerVisible(true);
  };

  // Get next available permission code
  const getNextPermissionCode = () => {
    if (permissions.length === 0) return 1;
    const maxCode = Math.max(...permissions.map((p: Permission) => p.permissionCode));
    return maxCode + 1;
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Permission',
      key: 'permission',
      render: (_: unknown, record: Permission) => (
        <div>
          <div style={{ fontWeight: 500, color: '#1890ff' }}>{record.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Code: {record.permissionCode}
          </Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
    {
      title: 'Code',
      dataIndex: 'permissionCode',
      key: 'permissionCode',
      render: (code: number) => <Tag color="blue">{code}</Tag>,
      sorter: (a: Permission, b: Permission) => a.permissionCode - b.permissionCode,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Permission, b: Permission) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Permission) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewPermission(record)} />
          </Tooltip>
          {hasPermission(PermissionCode.UPDATE_PERMISSION) && (
            <Tooltip title="Edit Permission">
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEditPermission(record)} />
            </Tooltip>
          )}
          {hasPermission(PermissionCode.DELETE_PERMISSION) && (
            <Tooltip title="Delete Permission">
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeletePermission(record)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (!hasPermission(PermissionCode.GET_PERMISSIONS)) {
    return (
      <PageContainer>
        <PageLoading tip="Access denied..." />
      </PageContainer>
    );
  }

  if (permissionsLoading) {
    return <PageLoading tip="Loading permissions..." />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }} className="mobile-stack">
        <Col xs={24} lg={12}>
          <Title level={2} style={{ margin: 0 }}>
            Permissions Management
          </Title>
          <Text type="secondary">Manage system permissions and access controls</Text>
        </Col>
        <Col xs={24} lg={12} style={{ textAlign: 'right' }}>
          <Space size="small" className="responsive-button-group">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchPermissions()}
              loading={permissionsLoading}
              size="small"
            >
              <span className="desktop-only">Refresh</span>
            </Button>
            {hasPermission(PermissionCode.CREATE_PERMISSION) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)} size="small">
                <span className="desktop-only">Add Permission</span>
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
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary">
              {filteredPermissions.length} of {permissions.length} permissions
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Permissions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredPermissions}
          rowKey="id"
          loading={permissionsLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} permissions`,
            responsive: true,
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
        />
      </Card>

      {/* Create Permission Modal */}
      <Modal
        title="Create New Permission"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreatePermission}>
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[
              { required: true, message: 'Please enter permission name' },
              { min: 2, message: 'Permission name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter permission name (e.g., GET_USERS)" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter permission description" rows={3} />
          </Form.Item>

          <Form.Item
            name="permissionCode"
            label="Permission Code"
            initialValue={getNextPermissionCode()}
            rules={[
              { required: true, message: 'Please enter permission code' },
              { type: 'number', min: 1, message: 'Permission code must be a positive number' },
            ]}
          >
            <InputNumber placeholder="Enter permission code" style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createPermissionMutation.isPending}>
                Create Permission
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Permission Modal */}
      <Modal
        title="Edit Permission"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedPermission(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdatePermission}>
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[
              { required: true, message: 'Please enter permission name' },
              { min: 2, message: 'Permission name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="Enter permission name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter permission description" rows={3} />
          </Form.Item>

          <Form.Item
            name="permissionCode"
            label="Permission Code"
            rules={[
              { required: true, message: 'Please enter permission code' },
              { type: 'number', min: 1, message: 'Permission code must be a positive number' },
            ]}
          >
            <InputNumber placeholder="Enter permission code" style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsEditModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updatePermissionMutation.isPending}>
                Update Permission
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Details Drawer */}
      <Drawer
        title="Permission Details"
        open={isDetailDrawerVisible}
        onClose={() => {
          setIsDetailDrawerVisible(false);
          setSelectedPermission(null);
        }}
        width={600}
      >
        {selectedPermission && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <LockOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <Title level={4} style={{ margin: '16px 0 8px' }}>
                {selectedPermission.name}
              </Title>
              <Tag color="blue" style={{ fontSize: '14px' }}>
                Code: {selectedPermission.permissionCode}
              </Tag>
            </div>

            <Descriptions column={1} bordered style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Permission Name">{selectedPermission.name}</Descriptions.Item>
              <Descriptions.Item label="Permission Code">{selectedPermission.permissionCode}</Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedPermission.description || 'No description provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedPermission.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedPermission.updatedAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Roles with this Permission</Title>
            <div>
              {permissionRoles.length > 0 ? (
                <Space wrap>
                  {permissionRoles.map((role: Role) => (
                    <Tag key={role.id} color="green">
                      {role.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No roles assigned to this permission</Text>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
