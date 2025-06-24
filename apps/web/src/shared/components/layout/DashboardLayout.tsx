import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/features/navigation';

const { Content } = Layout;

/**
 * DashboardLayout component with responsive sidebar
 */
export const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMarginLeft = () => {
    if (isMobile) return 0;
    return sidebarCollapsed ? 80 : 256;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      <Layout
        style={{
          marginLeft: getMarginLeft(),
          transition: 'margin-left 0.2s',
        }}
      >
        <Content
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--ant-color-bg-layout)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
