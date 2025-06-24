import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

export function AuthLayout() {
  return (
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
  );
}
