import type { ThemeConfig } from "antd";
import { theme } from "antd";

const sharedTokens = {
    // Global tokens
    fontSize: 14,
    colorPrimary: "#2563eb", // Authority Cobalt
    colorInfo: "#2563eb",
    colorSuccess: "#10b981", // Emerald 500
    colorWarning: "#f59e0b", // Amber 500
    colorError: "#ef4444", // Red 500
    borderRadius: 8,
    controlHeight: 44, // Rule 11 Global Standard
    controlHeightLG: 48,
    controlHeightSM: 32,
    fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    wireframe: false,
};

const sharedComponents = {
    Input: {
        fontSize: 16, // iOS zoom fix
        controlHeight: 44,
        borderRadius: 6,
        activeShadow: "0 0 0 2px rgba(37, 99, 235, 0.1)",
        hoverBorderColor: "#3b82f6", // blue-500
        activeBorderColor: "#2563eb", // blue-600
    },
    Select: {
        fontSize: 16, // iOS zoom fix
        controlHeight: 44,
        borderRadius: 6,
        colorPrimaryHover: "#747bff",
    },
    DatePicker: {
        fontSize: 16,
        controlHeight: 44,
        borderRadius: 6,
    },
    Button: {
        borderRadius: 6,
        controlHeight: 44,
        fontWeight: 500,
        defaultShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        primaryShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        colorPrimary: "#2563eb",
        colorPrimaryHover: "#3b82f6",
        colorPrimaryActive: "#1d4ed8",
    },
    Card: {
        borderRadiusLG: 12,
        paddingLG: 24,
    },
    Menu: {
        activeBarBorderWidth: 0, // Remove the side bar line for a cleaner look
        itemBorderRadius: 6,
        itemMarginInline: 8,
        itemHeight: 40,
    },
    Typography: {
        fontFamilyCode: "'Fira Code', monospace",
        titleMarginBottom: 0.5,
    },
    Alert: {
        borderRadiusLG: 8,
    },
};

const lightComponents = {
    Card: {
        boxShadowTertiary: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)", // Subtle shadow
    },
    Layout: {
        bodyBg: "#f8fafc", // slate-50
        headerBg: "#ffffff",
        siderBg: "#ffffff",
    },
    Menu: {
        itemSelectedBg: "#eff6ff", // blue-50 (slight tint)
        itemSelectedColor: "#2563eb",
    },
};

const darkComponents = {
    Card: {
        boxShadowTertiary: "0 1px 3px 0 rgba(0, 0, 0, 0.5)",
    },
    Layout: {
        bodyBg: "#0f172a", // slate-950
        headerBg: "#1e293b", // slate-800
        siderBg: "#0f172a", // slate-950
    },
    Menu: {
        itemSelectedBg: "rgba(37, 99, 235, 0.15)", // Subtle blue halo in dark mode
        itemSelectedColor: "#60a5fa", // blue-400
    },
};

export const getThemeConfig = (isDark: boolean): ThemeConfig => {
    const activeComponents = isDark ? darkComponents : lightComponents;

    // Deep merge components (simple implementation for our known structure)
    const mergedComponents: ThemeConfig["components"] = { ...sharedComponents };

    // Explicitly merge overrides for known components to maintain full type safety
    // during the "simple implementation" phase.
    if (activeComponents.Card) {
        mergedComponents.Card = { ...sharedComponents.Card, ...activeComponents.Card };
    }
    if (activeComponents.Layout) {
        // Layout is only in activeComponents, so this works safely
        mergedComponents.Layout = activeComponents.Layout;
    }
    if (activeComponents.Menu) {
        mergedComponents.Menu = { ...sharedComponents.Menu, ...activeComponents.Menu };
    }

    return {
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: sharedTokens,
        components: mergedComponents,
    };
};
