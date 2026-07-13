import { Typography } from "antd";
import type React from "react";
import type { ReactNode } from "react";

const { Title, Text } = Typography;

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    /** Optional uppercase eyebrow above the title (e.g. org name / section). */
    eyebrow?: string;
    actions?: ReactNode;
    className?: string;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    eyebrow,
    actions,
    className = "mb-6",
}) => {
    return (
        <div
            className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}
        >
            <div className="min-w-0">
                {eyebrow ? (
                    <Text className="uppercase tracking-[0.14em] text-xs font-semibold text-primary block mb-2">
                        {eyebrow}
                    </Text>
                ) : null}
                <Title level={2} className="!m-0 font-display tracking-tight">
                    {title}
                </Title>
                {subtitle ? (
                    <Text type="secondary" className="text-base block mt-1">
                        {subtitle}
                    </Text>
                ) : null}
            </div>
            {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
        </div>
    );
};
