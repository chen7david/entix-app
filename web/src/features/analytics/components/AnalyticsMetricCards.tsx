import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { SummaryCardsRow } from "@web/src/components/data/SummaryCardsRow";
import { useOrganization } from "@web/src/features/organization";
import { useScheduleMetrics } from "@web/src/features/schedule";

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
        <SummaryCardsRow
            items={[
                {
                    key: "total",
                    label: "Total Sessions",
                    value: metrics?.total || 0,
                    icon: <ClockCircleOutlined />,
                    color: "#1890ff",
                },
                {
                    key: "completed",
                    label: "Completed",
                    value: metrics?.completed || 0,
                    icon: <CheckCircleOutlined />,
                    color: "#52c41a",
                },
                {
                    key: "cancelled",
                    label: "Cancelled",
                    value: metrics?.cancelled || 0,
                    icon: <CloseCircleOutlined />,
                    color: "#ff4d4f",
                },
            ]}
        />
    );
};
