import { useUserPreferences } from "@web/src/features/auth";
import { App as AntApp, ConfigProvider } from "antd";
import type React from "react";
import { useLayoutEffect } from "react";
import { getThemeConfig } from "../theme/tokens";

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { theme } = useUserPreferences();
    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Sync theme to document element for Tailwind dark mode classes
    useLayoutEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDark]);

    return (
        <ConfigProvider theme={getThemeConfig(isDark)}>
            <AntApp>{children}</AntApp>
        </ConfigProvider>
    );
};
