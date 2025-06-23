import { useState, useMemo } from 'react';
import { Card, Typography, App } from 'antd';
import { UsersTable } from '../components/UsersTable';
import { UsersFilters } from '../components/UsersFilters';
import { useUsers } from '../services/users.service';
import { ResponsiveContainer } from '@shared/components';
import type { User } from '@shared/types';

const { Title } = Typography;

/**
 * Users Management Page
 * Refactored into modular components for better maintainability
 */
export const UsersPage = () => {
  const { message } = App.useApp();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Data fetching
  const { data: users = [], isLoading, refetch } = useUsers();

  // Filtered users based on search and status
  const filteredUsers = useMemo(() => {
    return users.filter((user: User) => {
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
  }, [users, searchTerm, selectedStatus]);

  // Handlers
  const handleEditUser = (user: User) => {
    message.info(`Edit user: ${user.username}`);
  };

  const handleViewUser = (user: User) => {
    message.info(`View user: ${user.username}`);
  };

  const handleCreateUser = () => {
    message.info('Create user functionality will be implemented');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <ResponsiveContainer>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>User Management</Title>
      </div>

      <Card>
        <UsersFilters
          searchTerm={searchTerm}
          selectedStatus={selectedStatus}
          loading={isLoading}
          onSearchChange={setSearchTerm}
          onStatusChange={setSelectedStatus}
          onRefresh={handleRefresh}
          onCreateUser={handleCreateUser}
        />

        <UsersTable users={filteredUsers} loading={isLoading} onEdit={handleEditUser} onView={handleViewUser} />
      </Card>
    </ResponsiveContainer>
  );
};
