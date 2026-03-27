import { useUserPreferences } from "@web/src/hooks/auth/useUserPreferences";
import { App as AntApp, ConfigProvider } from "antd";
import type React from "react";
import { getThemeConfig } from "../theme/tokens";

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { theme } = useUserPreferences();
    const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <ConfigProvider theme={getThemeConfig(isDark)}>
            <AntApp>{children}</AntApp>
        </ConfigProvider>
    );
};
