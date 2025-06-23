import { Card, Typography, Tag, Divider, Row, Col, Space } from 'antd';
import { useUserPermissions } from '@/hooks/profile/useUserPermissions';
import { PROFILE_STYLES } from './constants';

const { Title, Paragraph, Text } = Typography;

/**
 * User permissions card component displaying permissions and status
 */
export const UserPermissionsCard = () => {
  const { permissionTags, permissionStatus, hasAnyPermissions, isLoading } = useUserPermissions();

  if (isLoading) {
    return <Card title="Your Permissions" style={PROFILE_STYLES.card} loading={true} />;
  }

  return (
    <Card title="Your Permissions" style={PROFILE_STYLES.card}>
      {/* Permission Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {hasAnyPermissions ? (
          permissionTags.map(tag => (
            <Tag key={tag.code} color="blue">
              {tag.name}
            </Tag>
          ))
        ) : (
          <Text type="secondary">No permissions assigned</Text>
        )}
      </div>

      <Divider />

      {/* Permission Status */}
      <Title level={4}>Permission Status</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="small">
            {permissionStatus.slice(0, 2).map(status => (
              <Paragraph key={status.permission}>
                <Text strong>{status.label}:</Text>{' '}
                {status.hasAccess ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>}
              </Paragraph>
            ))}
          </Space>
        </Col>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="small">
            {permissionStatus.slice(2).map(status => (
              <Paragraph key={status.permission}>
                <Text strong>{status.label}:</Text>{' '}
                {status.hasAccess ? <Tag color="success">Yes</Tag> : <Tag color="error">No</Tag>}
              </Paragraph>
            ))}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
