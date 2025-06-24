import React from 'react';
import { Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

type PermissionsFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
};

/**
 * Filters component for permissions search and refresh
 */
export const PermissionsFilters: React.FC<PermissionsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  loading,
}) => {
  return (
    <Space>
      <Input
        placeholder="Search permissions by name, description, or code..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        style={{ width: 300 }}
        allowClear
      />
      <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} title="Refresh permissions">
        Refresh
      </Button>
    </Space>
  );
};
