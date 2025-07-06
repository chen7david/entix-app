import { useState } from 'react';
import { Card, Button, Space, Modal, Typography, Drawer, Descriptions, Divider, Avatar, Tag } from 'antd';
import { PlusOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { usePermissions as useAuthPermissions } from '@/features/auth/hooks/useAuth';
import { PermissionCode } from '@repo/entix-sdk';
import type { Permission, Role } from '@repo/entix-sdk';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionsTable, PermissionsFilters, CreatePermissionForm, EditPermissionForm } from '../components';
import { PageContainer } from '@/shared/components/layout';
import { ErrorResults } from '@/shared/components/ui/error-result';

const { Title, Text } = Typography;

/**
 * Permissions management page with CRUD operations
 */
export default function PermissionsPage() {
  const { hasPermission } = useAuthPermissions();
  const {
    permissions,
    permissionRoles,
    selectedPermission,
    permissionsLoading,
    isCreating,
    isUpdating,
    createPermission,
    updatePermission,
    deletePermission,
    selectPermission,
    refetchPermissions,
    getNextPermissionCode,
  } = usePermissions();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(
    (permission: Permission) =>
      !searchTerm ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permissionCode.toString().includes(searchTerm),
  );

  // Handle permission creation
  const handleCreatePermission = async (permissionData: {
    name: string;
    permissionCode: number;
    description?: string;
  }) => {
    try {
      await createPermission(permissionData);
      setIsCreateModalVisible(false);
    } catch (error) {
      console.error('Create permission error:', error);
    }
  };

  // Handle permission update
  const handleUpdatePermission = async (permissionData: {
    name?: string;
    permissionCode?: number;
    description?: string | null;
  }) => {
    if (!selectedPermission) return;

    try {
      await updatePermission(selectedPermission.id, permissionData);
      setIsEditModalVisible(false);
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
      onOk: () => deletePermission(permission.id),
    });
  };

  // Handle edit permission
  const handleEditPermission = (permission: Permission) => {
    selectPermission(permission);
    setIsEditModalVisible(true);
  };

  // Handle view permission details
  const handleViewPermission = (permission: Permission) => {
    selectPermission(permission);
    setIsDetailDrawerVisible(true);
  };

  if (!hasPermission(PermissionCode.GET_PERMISSIONS)) {
    return (
      <PageContainer>
        <ErrorResults.AccessDenied />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Permissions Management"
      subtitle="Manage system permissions and access controls"
      extra={
        hasPermission(PermissionCode.CREATE_PERMISSION) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
            Create Permission
          </Button>
        )
      }
    >
      <Card
        style={{
          boxShadow: 'none',
          border: '1px solid var(--ant-color-border)',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <PermissionsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={refetchPermissions}
            loading={permissionsLoading}
          />

          <PermissionsTable
            permissions={filteredPermissions}
            loading={permissionsLoading}
            onEdit={handleEditPermission}
            onDelete={handleDeletePermission}
            onView={handleViewPermission}
            canEdit={hasPermission(PermissionCode.UPDATE_PERMISSION)}
            canDelete={hasPermission(PermissionCode.DELETE_PERMISSION)}
            canView={hasPermission(PermissionCode.GET_PERMISSION)}
          />
        </Space>
      </Card>

      {/* Create Permission Modal */}
      <Modal
        title="Create New Permission"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <CreatePermissionForm
          onSubmit={handleCreatePermission}
          onCancel={() => setIsCreateModalVisible(false)}
          loading={isCreating}
          nextPermissionCode={getNextPermissionCode()}
        />
      </Modal>

      {/* Edit Permission Modal */}
      <Modal
        title="Edit Permission"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        {selectedPermission && (
          <EditPermissionForm
            permission={selectedPermission}
            onSubmit={handleUpdatePermission}
            onCancel={() => setIsEditModalVisible(false)}
            loading={isUpdating}
          />
        )}
      </Modal>

      {/* Permission Details Drawer */}
      <Drawer
        title="Permission Details"
        placement="right"
        width={600}
        open={isDetailDrawerVisible}
        onClose={() => setIsDetailDrawerVisible(false)}
      >
        {selectedPermission && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Name">
                <Space>
                  <Avatar icon={<SafetyOutlined />} />
                  {selectedPermission.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Code">
                <Tag color="blue">{selectedPermission.permissionCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedPermission.description || 'No description'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {selectedPermission.createdAt ? new Date(selectedPermission.createdAt).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {selectedPermission.updatedAt ? new Date(selectedPermission.updatedAt).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={4}>
              <UserOutlined /> Roles ({permissionRoles.length})
            </Title>
            {permissionRoles.length > 0 ? (
              <div>
                {permissionRoles.map((role: Role) => (
                  <Tag key={role.id} color="blue" style={{ marginBottom: 8 }}>
                    {role.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary">No roles assigned</Text>
            )}
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
