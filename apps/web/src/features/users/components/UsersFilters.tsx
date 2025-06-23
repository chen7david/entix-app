import { Input, Select, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { usePermissions } from '@shared/hooks';
import { PermissionCode } from '@shared/types';

const { Search } = Input;
const { Option } = Select;

interface UsersFiltersProps {
  searchTerm: string;
  selectedStatus: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  onCreateUser: () => void;
}

/**
 * UsersFilters Component
 * Handles search, filtering, and action buttons for users
 */
export const UsersFilters = ({
  searchTerm,
  selectedStatus,
  loading,
  onSearchChange,
  onStatusChange,
  onRefresh,
  onCreateUser,
}: UsersFiltersProps) => {
  const { hasPermission } = usePermissions();

  return (
    <div style={{ marginBottom: '16px' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          <Search
            placeholder="Search users by username or email"
            allowClear
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />

          <Select value={selectedStatus} onChange={onStatusChange} style={{ width: 120 }}>
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Space>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>

          {hasPermission(PermissionCode.GET_USER) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreateUser}>
              Add User
            </Button>
          )}
        </Space>
      </Space>
    </div>
  );
};
