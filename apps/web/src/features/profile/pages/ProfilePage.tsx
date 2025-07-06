import { Card, Typography, Tag, Divider, Button, Alert, Avatar, Space, Row, Col } from 'antd';
import { UserOutlined, KeyOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth, usePermissions, useLogout } from '@/features/auth/hooks/useAuth';
import { PermissionGuard } from '@/features/navigation';
import { PermissionCode } from '@repo/entix-sdk';
import { useState } from 'react';

const { Title, Paragraph, Text } = Typography;

/**
 * ProfilePage component - displays user information and permissions
 * Now designed to work within DashboardLayout
 */
export const ProfilePage = () => {
  const { user } = useAuth();
  const { permissions, hasPermission } = usePermissions();
  const logout = useLogout();
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  const handlePasswordChangeWarning = () => {
    setShowPasswordAlert(true);
    // Show password change security warning
    const confirmed = window.confirm(
      'For security reasons, password changes are not available here. You will be logged out and redirected to the password reset flow. Continue?',
    );

    if (confirmed) {
      logout.mutate();
    } else {
      // Hide alert if user cancels
      setTimeout(() => setShowPasswordAlert(false), 3000);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--ant-color-bg-layout)',
        minHeight: '100vh',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <Title level={1} style={{ marginBottom: '8px' }}>
            Profile
          </Title>
          <Text type="secondary">Manage your account and view your permissions</Text>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* User Information Card */}
        <Col xs={24} lg={8}>
          <Card style={{ textAlign: 'center', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
            <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: '16px' }} />
            {user && (
              <>
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
                    onClick={() => logout.mutate()}
                    loading={logout.isPending}
                    style={{ width: '100%' }}
                  >
                    Logout
                  </Button>
                </Space>
              </>
            )}
          </Card>
        </Col>

        {/* Permissions and Details */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Password Change Security Notice - only show when needed */}
            {showPasswordAlert && (
              <Alert
                message="Password Security"
                description="For enhanced security, password changes require re-authentication through the secure password reset flow."
                type="info"
                showIcon
                closable
                onClose={() => setShowPasswordAlert(false)}
                style={{ boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}
              />
            )}

            {user && (
              <>
                {/* Permissions Card */}
                <Card
                  title="Your Permissions"
                  style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {permissions.length > 0 ? (
                      permissions.map((permissionCode: number) => (
                        <Tag key={permissionCode} color="blue">
                          {PermissionCode[permissionCode] || `Code: ${permissionCode}`}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">No permissions assigned</Text>
                    )}
                  </div>

                  <Divider />

                  <Title level={4}>Permission Status</Title>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="small">
                        <Paragraph>
                          <Text strong>Can view users:</Text>{' '}
                          {hasPermission(PermissionCode.GET_USERS) ? (
                            <Tag color="success">Yes</Tag>
                          ) : (
                            <Tag color="error">No</Tag>
                          )}
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Can create roles:</Text>{' '}
                          {hasPermission(PermissionCode.CREATE_ROLE) ? (
                            <Tag color="success">Yes</Tag>
                          ) : (
                            <Tag color="error">No</Tag>
                          )}
                        </Paragraph>
                      </Space>
                    </Col>
                    <Col xs={24} md={12}>
                      <Space direction="vertical" size="small">
                        <Paragraph>
                          <Text strong>Can manage permissions:</Text>{' '}
                          {hasPermission(PermissionCode.GET_PERMISSIONS) ? (
                            <Tag color="success">Yes</Tag>
                          ) : (
                            <Tag color="error">No</Tag>
                          )}
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Can view roles:</Text>{' '}
                          {hasPermission(PermissionCode.GET_ROLES) ? (
                            <Tag color="success">Yes</Tag>
                          ) : (
                            <Tag color="error">No</Tag>
                          )}
                        </Paragraph>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                {/* Permission-Based Actions Card */}
                <Card
                  title="Available Actions"
                  style={{ width: '100%', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <PermissionGuard
                        permission={PermissionCode.GET_USERS}
                        fallback={
                          <div
                            style={{
                              padding: '16px',
                              border: '1px dashed var(--ant-color-border)',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <Text type="secondary">Requires GET_USERS permission</Text>
                          </div>
                        }
                      >
                        <Button
                          type="primary"
                          style={{ width: '100%', height: '64px' }}
                          size="large"
                          onClick={() => (window.location.href = '/dashboard/users')}
                        >
                          View Users
                        </Button>
                      </PermissionGuard>
                    </Col>

                    <Col xs={24} md={8}>
                      <PermissionGuard
                        anyPermissions={[PermissionCode.CREATE_ROLE, PermissionCode.GET_ROLES]}
                        fallback={
                          <div
                            style={{
                              padding: '16px',
                              border: '1px dashed var(--ant-color-border)',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <Text type="secondary">Requires ROLE permissions</Text>
                          </div>
                        }
                      >
                        <Button
                          type="default"
                          style={{ width: '100%', height: '64px' }}
                          size="large"
                          onClick={() => (window.location.href = '/dashboard/roles')}
                        >
                          Manage Roles
                        </Button>
                      </PermissionGuard>
                    </Col>

                    <Col xs={24} md={8}>
                      <PermissionGuard
                        allPermissions={[PermissionCode.GET_PERMISSIONS]}
                        fallback={
                          <div
                            style={{
                              padding: '16px',
                              border: '1px dashed var(--ant-color-border)',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            <Text type="secondary">Requires PERMISSION permissions</Text>
                          </div>
                        }
                      >
                        <Button
                          type="dashed"
                          style={{ width: '100%', height: '64px' }}
                          size="large"
                          onClick={() => (window.location.href = '/dashboard/permissions')}
                        >
                          Permission Management
                        </Button>
                      </PermissionGuard>
                    </Col>
                  </Row>
                </Card>
              </>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};
