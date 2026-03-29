import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useOrganization } from "@web/src/features/organization";
import { useScheduleMetrics } from "@web/src/features/schedule";
import { Card, Col, Row, Statistic } from "antd";

export const AnalyticsMetricCards = ({
    queryStart,
    queryEnd,
}: {
    queryStart: number;
    queryEnd: number;
}) => {
    const { activeOrganization } = useOrganization();
    const { metrics } = useScheduleMetrics(activeOrganization?.id, queryStart, queryEnd);

    return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
                <Card bordered={false} className="shadow-sm">
                    <Statistic
                        title="Total Sessions"
                        value={metrics?.total || 0}
                        prefix={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card bordered={false} className="shadow-sm">
                    <Statistic
                        title="Completed"
                        value={metrics?.completed || 0}
                        prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card bordered={false} className="shadow-sm">
                    <Statistic
                        title="Cancelled"
                        value={metrics?.cancelled || 0}
                        prefix={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                    />
                </Card>
            </Col>
        </Row>
    );
};
