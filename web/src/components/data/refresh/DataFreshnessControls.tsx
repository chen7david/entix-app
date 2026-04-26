import { ReloadOutlined } from "@ant-design/icons";
import { Badge, Button, Tooltip, Typography } from "antd";
import type React from "react";

type Props = {
    freshnessLabel: string;
    freshnessTooltip: string;
    status: "idle" | "fresh" | "aging" | "stale";
    isRefreshing: boolean;
    onRefresh: () => void;
};

const statusToAntdStatus: Record<Props["status"], "default" | "success" | "warning" | "error"> = {
    idle: "default",
    fresh: "success",
    aging: "warning",
    stale: "error",
};

export const DataFreshnessControls: React.FC<Props> = ({
    freshnessLabel,
    freshnessTooltip,
    status,
    isRefreshing,
    onRefresh,
}) => {
    return (
        <div className="inline-flex flex-col gap-1 rounded-lg px-2 py-1 bg-black/[0.02] dark:bg-white/[0.04]">
            <div className="inline-flex items-center gap-2">
                <Tooltip title={freshnessTooltip}>
                    <span className="inline-flex items-center gap-2 min-w-[180px]">
                        <Badge status={isRefreshing ? "processing" : statusToAntdStatus[status]} />
                        <Typography.Text
                            type="secondary"
                            style={{
                                fontVariantNumeric: "tabular-nums",
                                fontFeatureSettings: '"tnum" 1',
                            }}
                        >
                            {freshnessLabel}
                        </Typography.Text>
                    </span>
                </Tooltip>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={isRefreshing}
                    size="small"
                    type="text"
                    className="h-[32px] px-2 rounded-lg"
                    disabled={isRefreshing}
                >
                    Refresh
                </Button>
            </div>
        </div>
    );
};
