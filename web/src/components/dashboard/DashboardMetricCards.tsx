import { Card, Row, Col, Statistic, Skeleton } from "antd";
import { ThunderboltOutlined, WarningOutlined, DatabaseOutlined, TeamOutlined } from "@ant-design/icons";
import type { BulkMetrics } from "@web/src/hooks/api/bulk-members.hooks";

interface DashboardMetricCardsProps {
    metrics?: BulkMetrics;
    loading: boolean;
}

export const DashboardMetricCards = ({ metrics, loading }: DashboardMetricCardsProps) => {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[1, 2, 3, 4].map(i => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Card bordered={false} className="shadow-sm">
                            <Skeleton active paragraph={{ rows: 1 }} />
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    }

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="shadow-sm border-l-4 border-blue-500">
                    <Statistic 
                        title="Total Members" 
                        value={metrics?.totalMembers || 0} 
                        prefix={<TeamOutlined className="text-blue-500 mr-2" />} 
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="shadow-sm border-l-4 border-green-500">
                    <Statistic 
                        title="Active Sessions" 
                        value={metrics?.activeSessions || 0} 
                        prefix={<ThunderboltOutlined className="text-green-500 mr-2" />} 
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="shadow-sm border-l-4 border-orange-500">
                    <Statistic 
                        title="Engagement Risk" 
                        value={metrics?.engagementRisk || 0} 
                        valueStyle={{ color: (metrics?.engagementRisk || 0) > 0 ? '#fa8c16' : undefined }}
                        prefix={<WarningOutlined className="text-orange-500 mr-2" />} 
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="shadow-sm border-l-4 border-purple-500">
                    <Statistic 
                        title="Storage Used" 
                        value={formatBytes(metrics?.totalStorage || 0)} 
                        prefix={<DatabaseOutlined className="text-purple-500 mr-2" />} 
                    />
                </Card>
            </Col>
        </Row>
    );
};
