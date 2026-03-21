import { Card, Row, Col, Statistic } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useScheduleMetrics } from "@web/src/hooks/useSchedule";
import { useOrganization } from "@web/src/hooks/auth/useOrganization";

export const AnalyticsMetricCards = ({ queryStart, queryEnd }: { queryStart: number; queryEnd: number }) => {
    const { activeOrganization } = useOrganization();
    const { metrics } = useScheduleMetrics(activeOrganization?.id, queryStart, queryEnd);
    
    return (
        <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
                <Card bordered={false} className="shadow-sm">
                    <Statistic 
                        title="Total Sessions" 
                        value={metrics?.total || 0} 
                        prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />} 
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card bordered={false} className="shadow-sm">
                    <Statistic 
                        title="Completed" 
                        value={metrics?.completed || 0} 
                        prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
                    />
                </Card>
            </Col>
            <Col span={8}>
                <Card bordered={false} className="shadow-sm">
                    <Statistic 
                        title="Cancelled" 
                        value={metrics?.cancelled || 0} 
                        prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />} 
                    />
                </Card>
            </Col>
        </Row>
    );
};
