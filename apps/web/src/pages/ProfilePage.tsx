import { Card, Typography, Tag, Divider, Button } from 'antd';
import { useAuth, usePermissions, useLogout } from '@/hooks/auth.hook';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PermissionCode } from '@repo/entix-sdk';

const { Title, Paragraph, Text } = Typography;

export const ProfilePage = () => {
  const { user } = useAuth();
  const { permissions, hasPermission } = usePermissions();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10 px-4">
      <Card className="w-full max-w-2xl shadow-md rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="mb-0">
            Your Profile
          </Title>
          <Button type="primary" danger onClick={() => logout.mutate()} loading={logout.isPending}>
            Logout
          </Button>
        </div>

        {user && (
          <>
            <Paragraph>
              <Text strong>Username:</Text> {user.username}
            </Paragraph>
            <Paragraph>
              <Text strong>Email:</Text> {user.email}
            </Paragraph>

            <Divider />

            <Title level={3}>Your Permissions</Title>
            <div className="flex flex-wrap gap-2 mb-4">
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

            <Title level={4}>Permission Examples</Title>
            <div className="space-y-2">
              <Paragraph>
                <Text strong>Can view users:</Text>{' '}
                {hasPermission(PermissionCode.GET_USERS) ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>}
              </Paragraph>
              <Paragraph>
                <Text strong>Can create roles:</Text>{' '}
                {hasPermission(PermissionCode.CREATE_ROLE) ? (
                  <Tag color="success">Yes</Tag>
                ) : (
                  <Tag color="error">No</Tag>
                )}
              </Paragraph>
            </div>

            <Divider />

            <Title level={4}>Permission-Based Components</Title>
            <div className="space-y-4">
              <PermissionGuard
                permission={PermissionCode.GET_USERS}
                fallback={<Text type="secondary">You need GET_USERS permission to see this button</Text>}
              >
                <Button type="primary">View Users</Button>
              </PermissionGuard>

              <PermissionGuard
                anyPermissions={[PermissionCode.CREATE_ROLE, PermissionCode.UPDATE_ROLE]}
                fallback={<Text type="secondary">You need CREATE_ROLE or UPDATE_ROLE permission</Text>}
              >
                <Button type="default">Manage Roles</Button>
              </PermissionGuard>

              <PermissionGuard
                allPermissions={[PermissionCode.GET_PERMISSIONS, PermissionCode.CREATE_PERMISSION]}
                fallback={<Text type="secondary">You need both GET_PERMISSIONS and CREATE_PERMISSION</Text>}
              >
                <Button type="dashed">Advanced Permission Management</Button>
              </PermissionGuard>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
