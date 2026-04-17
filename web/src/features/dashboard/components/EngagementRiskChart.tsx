import { WarningOutlined } from "@ant-design/icons";
import { CurrencyUtils } from "@web/src/utils/number";
import { Card, Spin, Typography } from "antd";
import type React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const { Text } = Typography;

interface EngagementRiskChartProps {
    totalMembers: number;
    atRiskMembers: number;
    loading: boolean;
}

export const EngagementRiskChart: React.FC<EngagementRiskChartProps> = ({
    totalMembers,
    atRiskMembers,
    loading,
}) => {
    const activeMembers = Math.max(0, totalMembers - atRiskMembers);

    const data = [
        { name: "Active", value: activeMembers, color: "#10b981" },
        { name: "At-Risk", value: atRiskMembers, color: "#fa8c16" },
    ];

    if (loading) {
        return (
            <Card className="shadow-sm h-full flex items-center justify-center py-8">
                <Spin />
            </Card>
        );
    }

    return (
        <Card
            title={
                <span>
                    <WarningOutlined className="mr-2 text-orange-500" /> Engagement Risk
                </span>
            }
            className="shadow-sm h-full"
        >
            <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: 8,
                                border: "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
                <Text type="secondary" className="text-xs">
                    {CurrencyUtils.formatNumber(atRiskMembers)} members with zero activity in 14
                    days
                </Text>
            </div>
        </Card>
    );
};
