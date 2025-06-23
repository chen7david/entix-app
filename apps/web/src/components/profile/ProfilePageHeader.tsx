import { Typography } from 'antd';
import { PROFILE_STYLES } from './constants';

const { Title, Text } = Typography;

/**
 * Profile page header component with title and description
 */
export const ProfilePageHeader = () => {
  return (
    <div style={PROFILE_STYLES.pageHeader}>
      <div>
        <Title level={1} style={{ marginBottom: '8px' }}>
          Profile
        </Title>
        <Text type="secondary">Manage your account and view your permissions</Text>
      </div>
    </div>
  );
};
