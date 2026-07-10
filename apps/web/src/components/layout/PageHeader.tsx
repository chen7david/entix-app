import { Typography } from "antd";
import type React from "react";
import type { ReactNode } from "react";

const { Title, Text } = Typography;

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    actions,
    className = "mb-8",
}) => {
    return (
        <div
            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}
        >
            <div>
                <Title level={2} style={{ margin: 0 }}>
                    {title}
                </Title>
                {subtitle && (
                    <Text type="secondary" className="text-base block mt-1">
                        {subtitle}
                    </Text>
                )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
};
