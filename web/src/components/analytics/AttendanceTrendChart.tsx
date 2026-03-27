import type { AttendanceTrend } from "@web/src/hooks/useAnalytics";
import { Card, Spin, Typography } from "antd";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const { Title } = Typography;

export const AttendanceTrendChart = ({
    data,
    isLoading,
}: {
    data: AttendanceTrend[];
    isLoading: boolean;
}) => {
    return (
        <Card
            bordered={false}
            className="shadow-sm h-full"
            styles={{ body: { height: 400, display: "flex", flexDirection: "column" } }}
        >
            <Title level={4} style={{ marginBottom: 24 }}>
                Student Attendance Ratios
            </Title>
            {isLoading ? (
                <div className="flex-1 flex justify-center items-center">
                    <Spin />
                </div>
            ) : (
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#E2E8F0"
                            />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip
                                cursor={{ fill: "#F8FAFC" }}
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                itemStyle={{ fontWeight: 500 }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                            <Bar dataKey="present" stackId="a" fill="#1677FF" name="Present" />
                            <Bar
                                dataKey="absent"
                                stackId="a"
                                fill="#E2E8F0"
                                name="Absent"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};
