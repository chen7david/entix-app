import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme } from "@web/src/hooks/useTheme";
import { Button, Tooltip } from "antd";
import type React from "react";

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <Button
                type="text"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                }}
                className={className}
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            >
                {showLabel && (isDark ? "Light Mode" : "Dark Mode")}
            </Button>
        </Tooltip>
    );
};
