import { Card, Typography, Button, Avatar, Space } from 'antd';
import { UserOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/auth.hook';
import { useProfileActions } from '@/hooks/profile/useProfileActions';
import { PROFILE_STYLES, PROFILE_CONFIG } from './constants';

const { Title, Text } = Typography;

/**
 * User information card component with avatar, details, and action buttons
 */
export const UserInfoCard = () => {
  const { user } = useAuth();
  const { handlePasswordChangeWarning, handleLogout, isLoggingOut } = useProfileActions();

  if (!user) {
    return null;
  }

  return (
    <Card style={PROFILE_STYLES.cardCentered}>
      <Avatar size={PROFILE_CONFIG.avatar.size} icon={<UserOutlined />} style={{ marginBottom: '16px' }} />
      <Title level={3} style={{ marginBottom: '8px' }}>
        {user.username}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
        {user.email}
      </Text>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button icon={<KeyOutlined />} onClick={handlePasswordChangeWarning} style={{ width: '100%' }}>
          Change Password
        </Button>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          loading={isLoggingOut}
          style={{ width: '100%' }}
        >
          Logout
        </Button>
      </Space>
    </Card>
  );
};
