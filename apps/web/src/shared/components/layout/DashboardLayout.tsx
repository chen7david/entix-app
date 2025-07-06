import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/features/navigation';
import { useResponsiveLayout } from '@/shared/hooks/useResponsive';

const { Content } = Layout;

/**
 * Modern DashboardLayout with responsive design and mobile support
 */
export const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, sidebarWidth, sidebarCollapsedWidth } = useResponsiveLayout();

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const getMarginLeft = () => {
    if (isMobile) return 0;
    return sidebarCollapsed ? sidebarCollapsedWidth : sidebarWidth;
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: 'var(--ant-color-bg-layout)' }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      <Layout
        style={{
          marginLeft: getMarginLeft(),
          transition: 'margin-left 0.2s ease-in-out',
          minHeight: '100vh',
        }}
      >
        <Content
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--ant-color-bg-layout)',
            padding: isMobile ? '80px 0 0 0' : '0',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
