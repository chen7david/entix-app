export type AppTheme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "entix-theme";

export const getStoredTheme = (): AppTheme => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(THEME_STORAGE_KEY) as AppTheme) || "light";
};

export const setStoredTheme = (theme: AppTheme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const resolveIsDark = (theme: AppTheme): boolean => {
    if (theme === "system") {
        return getSystemTheme() === "dark";
    }
    return theme === "dark";
};

/**
 * Apply the theme class to the document element (Zero-FOUC support).
 */
export const applyThemeClass = (isDark: boolean) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isDark) {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
};
