import { createContext, useContext } from "react";
import type { AppTheme } from "../utils/theme";

export interface ThemeContextType {
    theme: AppTheme;
    isDark: boolean;
    toggleTheme: () => void;
    updateTheme: (newTheme: AppTheme) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
