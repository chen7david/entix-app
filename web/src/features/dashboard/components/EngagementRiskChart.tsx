import { WarningOutlined } from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrgNavigate } from "@web/src/features/organization";
import { NumberUtils } from "@web/src/utils/number";
import { Alert, Spin, Typography } from "antd";
import type React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { DashboardCard } from "./DashboardCard";

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
    const navigateOrg = useOrgNavigate();
    const activeMembers = Math.max(0, totalMembers - atRiskMembers);

    const data = [
        { name: "Active", value: activeMembers, color: "#10b981" },
        { name: "At-Risk", value: atRiskMembers, color: "#fa8c16" },
    ];

    return (
        <DashboardCard
            titleText="Engagement Risk"
            icon={<WarningOutlined className="text-orange-500" />}
            onViewAll={() => navigateOrg(AppRoutes.org.admin.members)}
        >
            {loading ? (
                <div className="flex items-center justify-center py-8 h-[240px]">
                    <Spin />
                </div>
            ) : totalMembers === 0 ? (
                <div className="py-4">
                    <Alert message="No member data available." type="info" showIcon />
                </div>
            ) : (
                <>
                    <div style={{ width: "100%", height: 240 }}>
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
                                <Legend
                                    verticalAlign="bottom"
                                    height={40}
                                    wrapperStyle={{ paddingTop: "20px" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-2">
                        <Text type="secondary" className="text-xs">
                            {NumberUtils.formatNumber(atRiskMembers)} members with zero activity in
                            14 days
                        </Text>
                    </div>
                </>
            )}
        </DashboardCard>
    );
};
