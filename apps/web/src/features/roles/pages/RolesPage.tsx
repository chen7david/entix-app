import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Typography,
  Row,
  Col,
  Drawer,
  Descriptions,
  Transfer,
  Divider,
  Avatar,
  Tag,
} from 'antd';
import { PlusOutlined, UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { usePermissions } from '@/features/auth/hooks/useAuth';
import { PermissionCode } from '@repo/entix-sdk';
import type { Role, Permission, User } from '@repo/entix-sdk';
import { useRoles } from '../hooks/useRoles';
import { RolesTable, RolesFilters, CreateRoleForm, EditRoleForm } from '../components';

const { Title, Text } = Typography;

/**
 * Roles management page with CRUD operations and permission assignment
 */
export default function RolesPage() {
  const { hasPermission } = usePermissions();
  const {
    roles,
    permissions,
    rolePermissions,
    roleUsers,
    selectedRole,
    rolesLoading,
    isCreating,
    isUpdating,
    createRole,
    updateRole,
    deleteRole,
    assignPermission,
    removePermission,
    selectRole,
    refetchRoles,
  } = useRoles();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(false);
  const [permissionTargetKeys, setPermissionTargetKeys] = useState<string[]>([]);

  // Filter roles based on search
  const filteredRoles = roles.filter(
    role =>
      !searchTerm ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle role creation
  const handleCreateRole = async (roleData: { name: string; description?: string }) => {
    try {
      await createRole(roleData);
      setIsCreateModalVisible(false);
    } catch (error) {
      console.error('Create role error:', error);
    }
  };

  // Handle role update
  const handleUpdateRole = async (roleData: { description?: string }) => {
    if (!selectedRole) return;

    try {
      await updateRole(selectedRole.id, roleData);
      setIsEditModalVisible(false);
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
      onOk: () => deleteRole(role.id),
    });
  };

  // Handle edit role
  const handleEditRole = (role: Role) => {
    selectRole(role);
    setIsEditModalVisible(true);
  };

  // Handle view role details
  const handleViewRole = (role: Role) => {
    selectRole(role);
    setIsDetailDrawerVisible(true);
  };

  // Handle manage permissions
  const handleManagePermissions = (role: Role) => {
    selectRole(role);
    setPermissionTargetKeys(rolePermissions.map(p => p.id));
    setIsPermissionsModalVisible(true);
  };

  // Handle permission transfer change
  const handlePermissionTransferChange = (targetKeys: React.Key[]) => {
    setPermissionTargetKeys(targetKeys as string[]);
  };

  // Handle permission assignment/removal
  const handlePermissionTransfer = async () => {
    if (!selectedRole) return;

    try {
      const currentPermissionIds = rolePermissions.map(p => p.id);
      const newPermissionIds = permissionTargetKeys;

      // Find permissions to add
      const permissionsToAdd = newPermissionIds.filter(id => !currentPermissionIds.includes(id));
      // Find permissions to remove
      const permissionsToRemove = currentPermissionIds.filter(id => !newPermissionIds.includes(id));

      // Add new permissions
      for (const permissionId of permissionsToAdd) {
        await assignPermission(selectedRole.id, permissionId);
      }

      // Remove permissions
      for (const permissionId of permissionsToRemove) {
        await removePermission(selectedRole.id, permissionId);
      }

      setIsPermissionsModalVisible(false);
      setPermissionTargetKeys([]);
    } catch (error) {
      console.error('Permission transfer error:', error);
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>
            <TeamOutlined /> Roles Management
          </Title>
        </Col>
        <Col>
          {hasPermission(PermissionCode.CREATE_ROLE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
              Create Role
            </Button>
          )}
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <RolesFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onRefresh={refetchRoles}
            loading={rolesLoading}
          />

          <RolesTable
            roles={filteredRoles}
            loading={rolesLoading}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
            onView={handleViewRole}
            onManagePermissions={handleManagePermissions}
            canEdit={hasPermission(PermissionCode.UPDATE_ROLE)}
            canDelete={hasPermission(PermissionCode.DELETE_ROLE)}
            canView={hasPermission(PermissionCode.GET_ROLE)}
            canManagePermissions={hasPermission(PermissionCode.CREATE_ROLE_PERMISSION)}
          />
        </Space>
      </Card>

      {/* Create Role Modal */}
      <Modal
        title="Create New Role"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <CreateRoleForm
          onSubmit={handleCreateRole}
          onCancel={() => setIsCreateModalVisible(false)}
          loading={isCreating}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title="Edit Role"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        {selectedRole && (
          <EditRoleForm
            role={selectedRole}
            onSubmit={handleUpdateRole}
            onCancel={() => setIsEditModalVisible(false)}
            loading={isUpdating}
          />
        )}
      </Modal>

      {/* Role Details Drawer */}
      <Drawer
        title="Role Details"
        placement="right"
        width={600}
        open={isDetailDrawerVisible}
        onClose={() => setIsDetailDrawerVisible(false)}
      >
        {selectedRole && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Name">
                <Space>
                  <Avatar icon={<TeamOutlined />} />
                  {selectedRole.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Description">{selectedRole.description || 'No description'}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {selectedRole.createdAt ? new Date(selectedRole.createdAt).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {selectedRole.updatedAt ? new Date(selectedRole.updatedAt).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={4}>
              <LockOutlined /> Permissions ({rolePermissions.length})
            </Title>
            {rolePermissions.length > 0 ? (
              <div>
                {rolePermissions.map((permission: Permission) => (
                  <Tag key={permission.id} color="green" style={{ marginBottom: 8 }}>
                    {permission.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary">No permissions assigned</Text>
            )}

            <Divider />

            <Title level={4}>
              <UserOutlined /> Users ({roleUsers.length})
            </Title>
            {roleUsers.length > 0 ? (
              <div>
                {roleUsers.map((user: User) => (
                  <Tag key={user.id} color="blue" style={{ marginBottom: 8 }}>
                    {user.email}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary">No users assigned</Text>
            )}
          </div>
        )}
      </Drawer>

      {/* Permissions Management Modal */}
      <Modal
        title={`Manage Permissions - ${selectedRole?.name}`}
        open={isPermissionsModalVisible}
        onCancel={() => setIsPermissionsModalVisible(false)}
        onOk={handlePermissionTransfer}
        okText="Save Changes"
        cancelText="Cancel"
        width={800}
      >
        <Transfer
          dataSource={permissions.map((permission: Permission) => ({
            key: permission.id,
            title: permission.name,
            description: permission.description || undefined,
          }))}
          titles={['Available Permissions', 'Assigned Permissions']}
          targetKeys={permissionTargetKeys}
          onChange={handlePermissionTransferChange}
          render={item => item.title || ''}
          showSearch
          filterOption={(inputValue, item) => (item.title || '').toLowerCase().indexOf(inputValue.toLowerCase()) !== -1}
        />
      </Modal>
    </div>
  );
}
