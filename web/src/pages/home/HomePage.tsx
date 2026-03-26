import React from 'react';
import { Typography, Row, Col, Card, Button, Space, Divider, Alert } from 'antd';
import { 
    TeamOutlined, 
    UploadOutlined, 
    ArrowRightOutlined, 
    LineChartOutlined, 
    WarningOutlined,
    NotificationOutlined,
    ThunderboltOutlined,
    GiftOutlined
} from '@ant-design/icons';
import { useOrganization } from '@web/src/hooks/auth/useOrganization';
import { useBulkMembers } from '@web/src/hooks/api/bulk-members.hooks';
import { Toolbar } from '@web/src/components/navigation/Toolbar/Toolbar';
import { DashboardMetricCards } from '@web/src/components/dashboard/DashboardMetricCards';
import { SessionVolumeChart } from '@web/src/components/analytics/SessionVolumeChart';
import { useAnalytics } from '@web/src/hooks/useAnalytics';
import { DateUtils } from '@web/src/utils/date';
import { useOrgNavigate } from '@web/src/hooks/navigation/useOrgNavigate';
import { AppRoutes } from '@shared/constants/routes';

const { Title, Text } = Typography;

export const HomePage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const navigateOrg = useOrgNavigate();
    const { metrics, isLoadingMetrics } = useBulkMembers(activeOrganization?.id);
    
    // Default to last 30 days for activity chart
    const queryEnd = DateUtils.endOf('day');
    const queryStart = DateUtils.offsetStartOf(-30, 'day', 'day');
    
    const { sessionTrends, isLoadingSessions } = useAnalytics(activeOrganization?.id, queryStart, queryEnd);

    return (
        <>
            <Toolbar />
            <div className="p-6 overflow-auto" style={{ height: 'calc(100dvh - 64px)' }}>
                <div className="mb-6">
                    <Title level={2} className="m-0">Organization Dashboard</Title>
                    <Text type="secondary">Welcome back to {activeOrganization?.name}. Your central command for organization health.</Text>
                </div>

                <DashboardMetricCards metrics={metrics} loading={isLoadingMetrics} />

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card 
                            title={<span><LineChartOutlined className="mr-2" /> Member Activity (Last 30 Days)</span>} 
                            className="shadow-sm h-full"
                        >
                            <SessionVolumeChart data={sessionTrends} isLoading={isLoadingSessions} />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Space direction="vertical" className="w-full" size="middle">
                            <Card 
                                title={<span><ThunderboltOutlined className="mr-2 text-yellow-500" /> Quick Actions</span>} 
                                className="shadow-sm"
                            >
                                <Space direction="vertical" className="w-full">
                                    <Button 
                                        block 
                                        icon={<TeamOutlined />} 
                                        onClick={() => navigateOrg(AppRoutes.org.manage.members)}
                                    >
                                        Manage Members
                                    </Button>
                                    <Button 
                                        block 
                                        icon={<UploadOutlined />} 
                                        onClick={() => navigateOrg('/manage/bulk')}
                                    >
                                        Bulk Import/Export
                                    </Button>
                                    <Divider className="my-2" />
                                    <Button type="link" block onClick={() => navigateOrg(AppRoutes.org.manage.analytics)}>
                                        View Full Analytics <ArrowRightOutlined />
                                    </Button>
                                </Space>
                            </Card>

                            <Card 
                                title={<span><GiftOutlined className="mr-2 text-rose-500" /> Upcoming Birthdays</span>} 
                                className="shadow-sm"
                            >
                                {metrics?.upcomingBirthdays && metrics.upcomingBirthdays.length > 0 ? (
                                    <div className="space-y-4">
                                        {metrics.upcomingBirthdays.map(b => (
                                            <div key={b.userId} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <div className="font-medium">{b.name}</div>
                                                    <Text type="secondary" className="text-xs">
                                                        {DateUtils.format(b.birthDate, 'MMMM D')}
                                                    </Text>
                                                </div>
                                                <div className="text-rose-500 text-xs font-semibold">
                                                    {b.daysUntil === 0 ? 'Today!' : `in ${b.daysUntil} days`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Text type="secondary" italic>No birthdays in the next 7 days.</Text>
                                )}
                            </Card>

                            <Card 
                                title={<span><WarningOutlined className="mr-2 text-orange-500" /> Engagement Risk</span>} 
                                className="shadow-sm"
                            >
                                {metrics && metrics.engagementRisk > 0 ? (
                                    <div className="text-center py-2">
                                        <Title level={3} className="m-0 text-orange-500">{metrics.engagementRisk}</Title>
                                        <Text type="secondary">Members have zero activity in the last 14 days.</Text>
                                        <Button 
                                            type="primary" 
                                            ghost 
                                            className="mt-4" 
                                            icon={<NotificationOutlined />}
                                            onClick={() => navigateOrg(AppRoutes.org.manage.members)}
                                        >
                                            Review Members
                                        </Button>
                                    </div>
                                ) : (
                                    <Alert
                                        message="Healthy Engagement"
                                        description="All members have been active recently."
                                        type="success"
                                        showIcon
                                    />
                                )}
                            </Card>
                        </Space>
                    </Col>
                </Row>
            </div>
        </>
    );
};
