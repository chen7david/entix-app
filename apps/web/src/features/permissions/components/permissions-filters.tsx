import React from 'react';
import { Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useResponsiveLayout } from '@/shared/hooks/useResponsive';

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
  const { isMobile } = useResponsiveLayout();

  return (
    <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }} size="small">
      <Input
        placeholder="Search permissions by name, description, or code..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          width: isMobile ? '100%' : 300,
          minWidth: isMobile ? 'auto' : 200,
        }}
        allowClear
      />
      <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} title="Refresh permissions">
        {!isMobile && 'Refresh'}
      </Button>
    </Space>
  );
};
