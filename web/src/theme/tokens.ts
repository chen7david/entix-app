import type { ThemeConfig } from "antd";
import { theme } from "antd";

const sharedTokens = {
    // Global tokens
    fontSize: 14,
    colorPrimary: "#646cff", // Vite Purple
    colorInfo: "#646cff",
    colorSuccess: "#10b981", // Emerald 500
    colorWarning: "#f59e0b", // Amber 500
    colorError: "#ef4444", // Red 500
    borderRadius: 8,
    fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    wireframe: false,
};

const sharedComponents = {
    Input: {
        fontSize: 16, // iOS zoom fix
        controlHeight: 40,
        borderRadius: 6,
        activeShadow: "0 0 0 2px rgba(100, 108, 255, 0.1)",
        hoverBorderColor: "#747bff",
        activeBorderColor: "#646cff",
    },
    Select: {
        fontSize: 16, // iOS zoom fix
        controlHeight: 40,
        borderRadius: 6,
        colorPrimaryHover: "#747bff",
    },
    DatePicker: {
        fontSize: 16,
        controlHeight: 40,
        borderRadius: 6,
    },
    Button: {
        borderRadius: 6,
        controlHeight: 40,
        fontWeight: 500,
        defaultShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        primaryShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        colorPrimary: "#646cff",
        colorPrimaryHover: "#747bff",
        colorPrimaryActive: "#535bf2",
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
        bodyBg: "#f9fafb",
        headerBg: "#ffffff",
        siderBg: "#ffffff",
    },
    Menu: {
        itemSelectedBg: "#eff0ff", // Very light purple
        itemSelectedColor: "#646cff",
    },
};

const darkComponents = {
    Card: {
        boxShadowTertiary: "0 1px 3px 0 rgba(0, 0, 0, 0.5)",
    },
    Layout: {
        bodyBg: "#141414",
        headerBg: "#1f1f1f",
        siderBg: "#141414",
    },
    Menu: {
        itemSelectedBg: "rgba(100, 108, 255, 0.15)", // Subtle purple halo in dark mode
        itemSelectedColor: "#8a94ff", // Lighter purple text in dark mode
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
