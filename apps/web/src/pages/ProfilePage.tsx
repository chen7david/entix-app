import { Row, Col, Space } from 'antd';
import { useAuth } from '@shared/hooks';
import { useProfileActions } from '@shared/hooks';
import {
  ProfilePageHeader,
  PasswordSecurityAlert,
  UserInfoCard,
  UserPermissionsCard,
  AvailableActionsCard,
  PROFILE_STYLES,
  PROFILE_CONFIG,
} from '@/components/profile';

/**
 * ProfilePage component - displays user information and permissions
 * Refactored into modular components for better maintainability
 */
export const ProfilePage = () => {
  const { user } = useAuth();
  const { showPasswordAlert, dismissPasswordAlert } = useProfileActions();

  return (
    <div style={PROFILE_STYLES.pageContainer}>
      <ProfilePageHeader />

      <Row gutter={PROFILE_CONFIG.grid.gutter}>
        {/* User Information Section */}
        <Col xs={24} lg={8}>
          <UserInfoCard />
        </Col>

        {/* Permissions and Actions Section */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={PROFILE_CONFIG.space.size} style={{ width: '100%' }}>
            {/* Password Change Security Notice */}
            <PasswordSecurityAlert visible={showPasswordAlert} onClose={dismissPasswordAlert} />

            {user && (
              <>
                {/* User Permissions */}
                <UserPermissionsCard />

                {/* Available Actions */}
                <AvailableActionsCard />
              </>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};
