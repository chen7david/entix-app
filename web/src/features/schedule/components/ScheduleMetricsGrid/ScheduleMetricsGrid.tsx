import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Card, Col, Row, Statistic, theme } from "antd";
import type React from "react";

type Props = {
    metrics?: {
        total: number;
        completed: number;
        cancelled: number;
    } | null;
    loading?: boolean;
};

export const ScheduleMetricsGrid: React.FC<Props> = ({ metrics, loading }) => {
    const { token } = theme.useToken();

    return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
                <Card
                    loading={loading}
                    style={{ border: `1px solid ${token.colorBorderSecondary}` }}
                >
                    <Statistic
                        title="Total Sessions"
                        value={metrics?.total || 0}
                        prefix={<ClockCircleOutlined style={{ color: token.colorPrimary }} />}
                        valueStyle={{ fontSize: token.fontSizeXL }}
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card
                    loading={loading}
                    style={{ border: `1px solid ${token.colorBorderSecondary}` }}
                >
                    <Statistic
                        title="Completed"
                        value={metrics?.completed || 0}
                        prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                        valueStyle={{ fontSize: token.fontSizeXL }}
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card
                    loading={loading}
                    style={{ border: `1px solid ${token.colorBorderSecondary}` }}
                >
                    <Statistic
                        title="Cancelled"
                        value={metrics?.cancelled || 0}
                        prefix={<CloseCircleOutlined style={{ color: token.colorError }} />}
                        valueStyle={{ fontSize: token.fontSizeXL }}
                    />
                </Card>
            </Col>
        </Row>
    );
};
