import { Outlet } from 'react-router-dom';
import { PublicRoute } from '@/features/navigation';
import { Layout } from 'antd';
import { useResponsiveLayout } from '@/shared/hooks/useResponsive';

const { Content } = Layout;

/**
 * PublicLayout component for pages accessible to non-authenticated users
 * Includes the PublicRoute guard to redirect authenticated users
 */
export const PublicLayout = () => {
  const { isMobile, spacing } = useResponsiveLayout();

  return (
    <PublicRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '16px' : '24px',
            backgroundColor: 'var(--ant-color-bg-layout)',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '500px',
              padding: isMobile ? '0' : `${spacing.lg}px`,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </PublicRoute>
  );
};
