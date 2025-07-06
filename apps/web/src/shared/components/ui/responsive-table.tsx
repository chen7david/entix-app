import { Table, type TableProps, type TablePaginationConfig } from 'antd';
import { useResponsiveLayout } from '@/shared/hooks/useResponsive';
import type { ReactNode } from 'react';

/**
 * Responsive table wrapper props
 */
export interface ResponsiveTableProps<T = Record<string, unknown>> extends Omit<TableProps<T>, 'scroll'> {
  /** Minimum table width for horizontal scrolling */
  minWidth?: number;
  /** Custom wrapper styling */
  wrapperStyle?: React.CSSProperties;
  /** Show scroll indicator on mobile */
  showScrollIndicator?: boolean;
  /** Custom scroll indicator content */
  scrollIndicator?: ReactNode;
}

/**
 * Responsive table wrapper component
 * Handles table overflow on small screens with horizontal scrolling
 */
export const ResponsiveTable = <T extends Record<string, unknown> = Record<string, unknown>>({
  minWidth = 800,
  wrapperStyle,
  showScrollIndicator = true,
  scrollIndicator,
  ...tableProps
}: ResponsiveTableProps<T>) => {
  const { isMobile, isTablet } = useResponsiveLayout();

  // Determine if we need horizontal scrolling
  const needsHorizontalScroll = isMobile || isTablet;

  // Handle pagination configuration
  const paginationConfig: TablePaginationConfig | false =
    tableProps.pagination === false
      ? false
      : {
          ...tableProps.pagination,
          // Show fewer items per page on mobile
          pageSize: isMobile ? 10 : (tableProps.pagination as TablePaginationConfig)?.pageSize || 20,
          // Show simple pagination on mobile
          showSizeChanger: !isMobile,
          showQuickJumper: !isMobile,
          showTotal: !isMobile ? (tableProps.pagination as TablePaginationConfig)?.showTotal : undefined,
        };

  return (
    <div
      style={{
        width: '100%',
        overflowX: needsHorizontalScroll ? 'auto' : 'visible',
        overflowY: 'visible',
        position: 'relative',
        ...wrapperStyle,
      }}
    >
      {needsHorizontalScroll && showScrollIndicator && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1,
            backgroundColor: 'var(--ant-color-bg-container)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--ant-color-text-secondary)',
            border: '1px solid var(--ant-color-border)',
            pointerEvents: 'none',
          }}
        >
          {scrollIndicator || '← Scroll →'}
        </div>
      )}

      <Table<T>
        {...tableProps}
        pagination={paginationConfig}
        scroll={needsHorizontalScroll ? { x: minWidth } : undefined}
        style={{
          ...tableProps.style,
          // Ensure table doesn't shrink on mobile
          minWidth: needsHorizontalScroll ? minWidth : undefined,
        }}
        // Optimize for mobile
        size={isMobile ? 'small' : 'middle'}
      />
    </div>
  );
};
