import { Button, Card, type CardProps } from "antd";
import type React from "react";

export interface DashboardCardProps {
    titleText: string;
    icon: React.ReactNode;
    onViewAll?: () => void;
    children: React.ReactNode;
    className?: string;
    /** Override Card body styles (e.g. custom padding). Merged on top of the default 12px 20px. */
    bodyStyle?: React.CSSProperties;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
    titleText,
    icon,
    onViewAll,
    children,
    className = "",
    bodyStyle,
}) => {
    const mergedStyles: CardProps["styles"] = {
        body: { padding: "12px 20px", ...bodyStyle },
    };

    return (
        <Card
            title={
                <span className="flex items-center">
                    {icon}
                    <span className="ml-2">{titleText}</span>
                </span>
            }
            extra={
                onViewAll ? (
                    <Button type="link" size="small" className="p-0 text-xs" onClick={onViewAll}>
                        View All
                    </Button>
                ) : undefined
            }
            className={`shadow-sm h-full ${className}`}
            styles={mergedStyles}
        >
            {children}
        </Card>
    );
};
