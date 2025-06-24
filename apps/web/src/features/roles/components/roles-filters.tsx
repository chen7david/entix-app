import React from 'react';
import { Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

type RolesFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
};

/**
 * Filters component for roles search and refresh
 */
export const RolesFilters: React.FC<RolesFiltersProps> = ({ searchTerm, onSearchChange, onRefresh, loading }) => {
  return (
    <Space>
      <Input
        placeholder="Search roles by name or description..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        style={{ width: 300 }}
        allowClear
      />
      <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} title="Refresh roles">
        Refresh
      </Button>
    </Space>
  );
};
