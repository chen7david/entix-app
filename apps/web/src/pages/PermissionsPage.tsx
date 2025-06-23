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
  message,
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
  SafetyOutlined,
  EyeOutlined,
  ReloadOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@lib/api-client';
import { usePermissions } from '@/hooks/auth.hook';
import { PermissionCode } from '@repo/entix-sdk';
import type { Permission, CreatePermissionParamsDto, UpdatePermissionParamsDto, Role } from '@repo/entix-sdk';

const { Title, Text } = Typography;
const { Search } = Input;
const { TextArea } = Input;

/**
 * Permissions management page with CRUD operations
 */
export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

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
    mutationFn: (permissionData: CreatePermissionParamsDto) => apiClient.permissions.createPermission(permissionData),
    onSuccess: () => {
      message.success('Permission created successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to create permission',
      );
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, permissionData }: { id: string; permissionData: UpdatePermissionParamsDto }) =>
      apiClient.permissions.updatePermission(id, permissionData),
    onSuccess: () => {
      message.success('Permission updated successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedPermission(null);
    },
    onError: (error: Error) => {
      message.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to update permission',
      );
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: string) => apiClient.permissions.deletePermission(permissionId),
    onSuccess: () => {
      message.success('Permission deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (error: Error) => {
      message.error(
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Failed to delete permission',
      );
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
  const handleCreatePermission = async (values: { name: string; permissionCode: number; description?: string }) => {
    try {
      const permissionData: CreatePermissionParamsDto = {
        name: values.name,
        permissionCode: values.permissionCode,
        description: values.description,
      };

      await createPermissionMutation.mutateAsync(permissionData);
    } catch (error) {
      console.error('Create permission error:', error);
    }
  };

  // Handle permission update
  const handleUpdatePermission = async (values: { name: string; permissionCode: number; description?: string }) => {
    if (!selectedPermission) return;

    try {
      const permissionData: UpdatePermissionParamsDto = {
        name: values.name,
        permissionCode: values.permissionCode,
        description: values.description,
      };

      await updatePermissionMutation.mutateAsync({
        id: selectedPermission.id,
        permissionData,
      });
    } catch (error) {
      console.error('Update permission error:', error);
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
      <Card style={{ boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <Title level={4} style={{ marginTop: '16px', color: '#999' }}>
            Access Denied
          </Title>
          <Text type="secondary">You don't have permission to view permissions.</Text>
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
            Permissions Management
          </Title>
          <Text type="secondary">Manage system permissions and access controls</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetchPermissions()} loading={permissionsLoading}>
              Refresh
            </Button>
            {hasPermission(PermissionCode.CREATE_PERMISSION) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
                Add Permission
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
          }}
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
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreatePermission}
          initialValues={{
            permissionCode: getNextPermissionCode(),
          }}
        >
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[
              { required: true, message: 'Please enter permission name' },
              { min: 3, message: 'Permission name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter permission name" />
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

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Enter permission description" rows={3} maxLength={500} showCount />
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
              <Button type="primary" htmlType="submit" loading={createPermissionMutation.isPending}>
                Create Permission
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Permission Modal */}
      <Modal
        title="Edit Permission"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setSelectedPermission(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdatePermission}>
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[
              { required: true, message: 'Please enter permission name' },
              { min: 3, message: 'Permission name must be at least 3 characters' },
            ]}
          >
            <Input placeholder="Enter permission name" />
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

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Enter permission description" rows={3} maxLength={500} showCount />
          </Form.Item>

          <Row justify="end" gutter={16}>
            <Col>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setSelectedPermission(null);
                }}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={updatePermissionMutation.isPending}>
                Update Permission
              </Button>
            </Col>
          </Row>
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
    </div>
  );
}
