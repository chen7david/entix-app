import { Card, Space, Typography, Modal, Badge, Descriptions, Drawer, Avatar, Button } from 'antd';
import { UserOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePermissions } from '@/features/auth/hooks/useAuth';
import { PermissionCode } from '@repo/entix-sdk';

// Import feature components
import { UsersTable, UsersFilters, CreateUserForm, EditUserForm } from '@/features/users/components';
import { useUsers, useUserRoles } from '@/features/users/hooks';

const { Title, Text } = Typography;

/**
 * UsersPage component for managing users
 * Uses dedicated components for better separation of concerns
 */
export default function UsersPage() {
  const { hasPermission } = usePermissions();
  const {
    // State
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    isCreateModalVisible,
    isEditModalVisible,
    isDetailDrawerVisible,
    selectedUser,

    // Data
    users,
    allUsers,
    usersLoading,

    // Actions
    handleCreateUser,
    handleUpdateUser,
    handleEditUser,
    handleViewUser,
    closeCreateModal,
    closeEditModal,
    closeDetailDrawer,
    refetchUsers,
    openCreateModal,
  } = useUsers();

  // Query for user roles when viewing details
  const { data: userRoles = [] } = useUserRoles(selectedUser?.id);

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
              <Button type="primary" onClick={openCreateModal}>
                Add User
              </Button>
            )}
          </Space>
        }
      >
        {/* Filters Component */}
        <UsersFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          users={allUsers}
          filteredUsers={users}
        />

        {/* Users Table Component */}
        <UsersTable users={users} loading={usersLoading} onEdit={handleEditUser} onView={handleViewUser} />
      </Card>

      {/* Create User Modal */}
      <Modal title="Create New User" open={isCreateModalVisible} onCancel={closeCreateModal} footer={null} width={600}>
        <CreateUserForm onSubmit={handleCreateUser} onCancel={closeCreateModal} loading={false} />
      </Modal>

      {/* Edit User Modal */}
      <Modal title="Edit User" open={isEditModalVisible} onCancel={closeEditModal} footer={null} width={600}>
        {selectedUser && (
          <EditUserForm user={selectedUser} onSubmit={handleUpdateUser} onCancel={closeEditModal} loading={false} />
        )}
      </Modal>

      {/* User Details Drawer */}
      <Drawer title="User Details" open={isDetailDrawerVisible} onClose={closeDetailDrawer} width={500}>
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
                    <Badge key={role.id} color="blue" text={role.name} />
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
