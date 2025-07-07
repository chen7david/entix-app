import { Outlet } from 'react-router-dom';
import { PublicRoute } from '@/components/PublicRoute';
import { Layout } from 'antd';

const { Content } = Layout;

/**
 * PublicLayout component for pages accessible to non-authenticated users
 * Includes the PublicRoute guard to redirect authenticated users
 */
export const PublicLayout = () => {
  return (
    <PublicRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--ant-color-bg-layout)',
          }}
        >
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </PublicRoute>
  );
};
