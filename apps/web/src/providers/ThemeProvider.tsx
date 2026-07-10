import { authClient, useSession } from "@web/src/lib/auth-client";
import { App as AntApp, ConfigProvider } from "antd";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ThemeContext } from "../hooks/useTheme";
import { getThemeConfig } from "../theme/tokens";
import {
    type AppTheme,
    applyThemeClass,
    getStoredTheme,
    setStoredTheme,
    THEME_STORAGE_KEY,
} from "../utils/theme";

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { data: session } = useSession();

    // 1. Initial state from localStorage (Zero-FOUC support)
    const [theme, setThemeState] = useState<AppTheme>(getStoredTheme);

    // 2. Track OS theme changes for real-time reactivity when in "system" mode
    const [systemIsDark, setSystemIsDark] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
    );

    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [theme]);

    // 3. Derive dark mode status reactively from the shared state
    const isDark = useMemo(() => {
        if (theme === "system") return systemIsDark;
        return theme === "dark";
    }, [theme, systemIsDark]);

    // 4. Synchronize DOM classes strictly with the source of truth
    useLayoutEffect(() => {
        applyThemeClass(isDark);
    }, [isDark]);

    // 5. Logic methods
    const updateTheme = useCallback(
        async (newTheme: AppTheme) => {
            setThemeState(newTheme);
            setStoredTheme(newTheme);

            if (session?.user) {
                try {
                    await authClient.updateUser({ theme: newTheme } as any);
                } catch (error) {
                    console.error("Failed to sync theme preference to DB:", error);
                }
            }
        },
        [session?.user]
    );

    const toggleTheme = useCallback(() => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        updateTheme(nextTheme);
    }, [theme, updateTheme]);

    // 6. Reconciliation: Deterministic hydration from DB vs. local persistence
    const userId = session?.user?.id;
    const dbTheme = (session?.user as any)?.theme as AppTheme | undefined;

    useEffect(() => {
        if (!userId) return;

        const localTheme = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;

        if (dbTheme && !localTheme) {
            // If the user has a profile theme but no local preference (new device/cleared cache), hydrate
            setThemeState(dbTheme);
            setStoredTheme(dbTheme);
        } else if (localTheme && dbTheme !== localTheme) {
            // Local is the rendering source of truth; push it back to the DB to ensure sync
            authClient.updateUser({ theme: localTheme } as any).catch(console.error);
        }
    }, [userId, dbTheme]);

    const contextValue = useMemo(
        () => ({
            theme,
            isDark,
            toggleTheme,
            updateTheme,
        }),
        [theme, isDark, toggleTheme, updateTheme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            <ConfigProvider theme={getThemeConfig(isDark)}>
                <AntApp>{children}</AntApp>
            </ConfigProvider>
        </ThemeContext.Provider>
    );
};
