import { SafetyOutlined, StopOutlined, TeamOutlined } from "@ant-design/icons";
import { UserTable, useAdminUsers } from "@web/src/features/admin";
import { Card, Col, Row, Statistic, Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const GlobalUsersPage: React.FC = () => {
    const { data: userData, isPending: isLoading } = useAdminUsers();
    const users = userData?.items || [];

    const totalUsers = users.length || 0;
    const adminUsers = users.filter((u: any) => u.role === "admin").length || 0;
    const bannedUsers = users.filter((u: any) => u.banned).length || 0;

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Global Users
                    </Title>
                    <Text type="secondary">Manage all platform users, roles, and access</Text>
                </div>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={8}>
                    <Card loading={isLoading}>
                        <Statistic
                            title="Total Users"
                            value={totalUsers}
                            prefix={<TeamOutlined style={{ color: "#2563eb" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card loading={isLoading}>
                        <Statistic
                            title="Platform Admins"
                            value={adminUsers}
                            prefix={<SafetyOutlined style={{ color: "#f59e0b" }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card loading={isLoading}>
                        <Statistic
                            title="Banned Users"
                            value={bannedUsers}
                            prefix={<StopOutlined style={{ color: "#ef4444" }} />}
                            valueStyle={bannedUsers > 0 ? { color: "#ef4444" } : undefined}
                        />
                    </Card>
                </Col>
            </Row>

            <UserTable />
        </div>
    );
};
