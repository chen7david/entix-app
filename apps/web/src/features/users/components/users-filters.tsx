import { Input, Space, Row, Col, Select, Card, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { User } from '@repo/entix-sdk';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

type UsersFiltersProps = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  users: User[];
  filteredUsers: User[];
};

/**
 * UsersFilters component for filtering and actions
 */
export const UsersFilters = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  users,
  filteredUsers,
}: UsersFiltersProps) => {
  return (
    <Card style={{ marginBottom: '24px', boxShadow: 'none', border: '1px solid var(--ant-color-border)' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder="Search users..."
            allowClear
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Filter by status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: '100%' }}
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Disabled</Option>
          </Select>
        </Col>
        <Col xs={24} md={10}>
          <Space>
            <Text type="secondary">
              {filteredUsers.length} of {users.length} users
            </Text>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
