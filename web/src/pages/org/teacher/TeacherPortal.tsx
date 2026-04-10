import {
    CalendarOutlined,
    OrderedListOutlined,
    PlaySquareOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrgNavigate } from "@web/src/features/organization";
import { Button, Card, Col, Row, Space, Typography, theme } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const TeacherPortal: React.FC = () => {
    const navigateOrg = useOrgNavigate();
    const { token } = theme.useToken();

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Teacher Dashboard
                </Title>
                <Text type="secondary">Manage your classes, media, and student engagement.</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Upcoming Classes" className="shadow-sm h-full">
                        <Space direction="vertical" className="w-full text-center py-8">
                            <CalendarOutlined
                                style={{ fontSize: 48, color: token.colorTextDisabled }}
                            />
                            <Text type="secondary">No classes scheduled for today.</Text>
                            <Button
                                type="primary"
                                onClick={() => navigateOrg(AppRoutes.org.teaching.schedule)}
                            >
                                Go to Schedule
                            </Button>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Space direction="vertical" className="w-full" size="middle">
                        <Card title="Quick Resources" className="shadow-sm">
                            <Space direction="vertical" className="w-full">
                                <Button
                                    block
                                    icon={<PlaySquareOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.teaching.media)}
                                >
                                    Media Library
                                </Button>
                                <Button
                                    block
                                    icon={<OrderedListOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.teaching.playlists)}
                                >
                                    Playlists
                                </Button>
                                <Button
                                    block
                                    icon={<TeamOutlined />}
                                    onClick={() => navigateOrg(AppRoutes.org.teaching.students)}
                                >
                                    Class Roster
                                </Button>
                            </Space>
                        </Card>
                        <Card title="Education Insights" className="shadow-sm">
                            <Text type="secondary" italic>
                                Student GPA trends, engagement scores, and attendance reports coming
                                soon.
                            </Text>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};
