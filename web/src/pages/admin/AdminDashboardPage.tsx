import { SafetyOutlined, StopOutlined, TeamOutlined } from "@ant-design/icons";
import { useAdminUsers } from "@web/src/features/admin";
import { useAuth } from "@web/src/features/auth";
import { Card, Col, Empty, Row, Statistic, Tag, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const AdminDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { data: userData } = useAdminUsers();
    const users = userData?.items || [];

    const totalUsers = users.length || 0;
    const adminUsers = users.filter((u: any) => u.role === "admin").length || 0;
    const bannedUsers = users.filter((u: any) => u.banned).length || 0;

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Admin Dashboard
                    </Title>
                    <Text type="secondary">Manage all system users</Text>
                </div>
                <Tag color="blue" className="text-sm px-3 py-1">
                    Logged in as: {user?.name}
                </Tag>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Total Users"
                            value={totalUsers}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="Admins" value={adminUsers} prefix={<SafetyOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic
                            title="Banned"
                            value={bannedUsers}
                            prefix={<StopOutlined />}
                            valueStyle={bannedUsers > 0 ? { color: "#ff4d4f" } : undefined}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 32 }}>
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span>
                            <strong>More Metrics Coming Soon</strong>
                            <br />
                            <Text type="secondary">
                                Reserved for administrative analytics and future charts.
                            </Text>
                        </span>
                    }
                />
            </Card>
        </div>
    );
};
