import { Empty, Typography, theme } from "antd";
import type React from "react";
import type { ReactNode } from "react";

const { Text } = Typography;

type TableEmptyStateProps = {
    icon: ReactNode;
    title?: string;
    subtitle?: string;
    action?: ReactNode;
};

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
    icon,
    title = "No matches found",
    subtitle = "Try adjusting your filters or search terms",
    action,
}) => {
    const { token } = theme.useToken();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <Empty
                image={
                    <div
                        style={{
                            fontSize: 44,
                            color: token.colorFillSecondary,
                            marginBottom: 12,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        {icon}
                    </div>
                }
                description={
                    <div className="max-w-[320px] mx-auto">
                        <p
                            style={{ color: token.colorTextSecondary }}
                            className="text-base font-medium mb-1"
                        >
                            {title}
                        </p>
                        <Text type="secondary">{subtitle}</Text>
                    </div>
                }
            >
                {action}
            </Empty>
        </div>
    );
};
