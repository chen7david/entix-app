import type { SessionTrend } from "@web/src/features/analytics";
import { Card, Spin, Typography } from "antd";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const { Title } = Typography;

export const SessionVolumeChart = ({
    data,
    isLoading,
}: {
    data: SessionTrend[];
    isLoading: boolean;
}) => {
    return (
        <Card
            variant="borderless"
            className="shadow-sm h-full"
            styles={{ body: { height: 400, display: "flex", flexDirection: "column" } }}
        >
            <Title level={4} style={{ marginBottom: 24 }}>
                Session Volume Trends
            </Title>
            {isLoading ? (
                <div className="flex-1 flex justify-center items-center">
                    <Spin />
                </div>
            ) : (
                <div style={{ width: "100%", height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1677FF" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#1677FF" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#52C41A" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#52C41A" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF4D4F" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#FF4D4F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#E2E8F0"
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                itemStyle={{ fontWeight: 500 }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                            <Area
                                type="monotone"
                                dataKey="scheduled"
                                stroke="#1677FF"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorScheduled)"
                                name="Scheduled"
                            />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                stroke="#52C41A"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCompleted)"
                                name="Completed"
                            />
                            <Area
                                type="monotone"
                                dataKey="cancelled"
                                stroke="#FF4D4F"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCancelled)"
                                name="Cancelled"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};
