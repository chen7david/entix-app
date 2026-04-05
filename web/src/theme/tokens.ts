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
    borderRadius: 6, // Refined: 8 -> 6 for professional sharpness
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
        activeShadow: "none",
        errorActiveShadow: "none",
        warningActiveShadow: "none",
        hoverBorderColor: "#3b82f6", // blue-500
        activeBorderColor: "#2563eb", // blue-600
    },
    Select: {
        fontSize: 16, // iOS zoom fix
        controlHeight: 44,
        borderRadius: 6,
        colorPrimaryHover: "#3b82f6", // Unified cobalt hover
    },
    DatePicker: {
        fontSize: 16,
        controlHeight: 44,
        borderRadius: 6,
        activeShadow: "none",
        errorActiveShadow: "none",
        warningActiveShadow: "none",
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
        borderRadiusLG: 8, // Refined: 12 -> 8 (matches borderRadius token)
        paddingLG: 20, // Refined: 24 -> 20 for denser interiors
        colorBorderSecondary: "transparent",
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
        boxShadowTertiary: "none",
    },
    Layout: {
        bodyBg: "#f8fafc", // slate-50
        headerBg: "#ffffff",
        siderBg: "#ffffff",
    },
    Menu: {
        itemSelectedBg: "#eff6ff", // blue-50 (slight cobalt tint)
        itemSelectedColor: "#2563eb",
    },
};

const darkComponents = {
    Card: {
        boxShadowTertiary: "none",
    },
    Layout: {
        bodyBg: "#0f172a", // slate-950
        headerBg: "#1e293b", // slate-800
        siderBg: "#0f172a", // slate-950
    },
    Menu: {
        itemSelectedBg: "rgba(37, 99, 235, 0.15)", // Clean cobalt halo
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
