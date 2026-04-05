import { Empty, Typography, theme } from "antd";
import type React from "react";
import type { ReactNode } from "react";

const { Text } = Typography;

type TableEmptyStateProps = {
    icon: ReactNode;
    title?: string;
    subtitle?: string;
};

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
    icon,
    title = "No matches found",
    subtitle = "Try adjusting your filters or search terms",
}) => {
    const { token } = theme.useToken();

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <Empty
                image={
                    <div
                        style={{
                            fontSize: 64,
                            color: token.colorFillSecondary,
                            marginBottom: 16,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        {icon}
                    </div>
                }
                description={
                    <div className="max-w-[300px] mx-auto">
                        <p
                            style={{ color: token.colorTextSecondary }}
                            className="text-lg font-medium mb-1"
                        >
                            {title}
                        </p>
                        <Text type="secondary">{subtitle}</Text>
                    </div>
                }
            />
        </div>
    );
};
