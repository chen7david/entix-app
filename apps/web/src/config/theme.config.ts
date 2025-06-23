import { theme } from 'antd';

/**
 * Modern color palette for the application
 * Based on 2024 design trends with accessibility-compliant contrasts
 */
const modernColors = {
  // Primary brand colors - Deep space blue with variations
  primary: {
    50: '#e6f0ff',
    100: '#b3d3ff',
    200: '#80b6ff',
    300: '#4d99ff',
    400: '#1a7cff',
    500: '#0066ff', // Primary brand color
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
  },

  // Secondary colors - Cosmic purple
  secondary: {
    50: '#f0ecff',
    100: '#d1c3ff',
    200: '#b399ff',
    300: '#9470ff',
    400: '#7546ff',
    500: '#5a1cff',
    600: '#4a16d6',
    700: '#3910b3',
    800: '#280a90',
    900: '#17046d',
  },

  // Success colors - Aurora green
  success: {
    50: '#f0fff4',
    100: '#c6f6d5',
    200: '#9ae6b4',
    300: '#68d391',
    400: '#48bb78',
    500: '#38a169',
    600: '#2f855a',
    700: '#276749',
    800: '#22543d',
    900: '#1a202c',
  },

  // Warning colors - Solar amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error colors - Nova red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral grays - Sophisticated charcoal to light
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
};

/**
 * Light theme configuration
 */
const lightTheme = {
  token: {
    // Base font size for mobile-first design (prevents auto-zoom)
    fontSize: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", sans-serif',

    // Brand colors
    colorPrimary: modernColors.primary[500],
    colorSuccess: modernColors.success[500],
    colorWarning: modernColors.warning[500],
    colorError: modernColors.error[500],
    colorInfo: modernColors.primary[400],

    // Background colors
    colorBgContainer: '#ffffff',
    colorBgLayout: modernColors.neutral[50],
    colorBgElevated: '#ffffff',
    colorBgSpotlight: modernColors.neutral[100],
    colorBgMask: 'rgba(0, 0, 0, 0.45)',

    // Text colors
    colorText: modernColors.neutral[800],
    colorTextSecondary: modernColors.neutral[600],
    colorTextTertiary: modernColors.neutral[500],
    colorTextQuaternary: modernColors.neutral[400],

    // Border colors
    colorBorder: modernColors.neutral[200],
    colorBorderSecondary: modernColors.neutral[100],

    // Component specific colors
    colorFillAlter: modernColors.neutral[50],
    colorFillSecondary: modernColors.neutral[100],
    colorFillTertiary: modernColors.neutral[200],
    colorFillQuaternary: modernColors.neutral[300],

    // Interactive states
    colorPrimaryHover: modernColors.primary[400],
    colorPrimaryActive: modernColors.primary[600],
    colorPrimaryBorder: modernColors.primary[300],
    colorPrimaryBorderHover: modernColors.primary[400],

    // Spacing and sizing
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // Control heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    controlHeightXS: 24,

    // Layout
    marginLG: 24,
    marginMD: 16,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,

    paddingLG: 24,
    paddingMD: 16,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,

    // Animation
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',

    // Box shadow
    boxShadow: 'none',
    boxShadowSecondary: 'none',
    boxShadowTertiary: 'none',
  },
  components: {
    Button: {
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      ghostShadow: 'none',
    },
    Card: {
      borderRadius: 12,
      paddingLG: 24,
      boxShadow: 'none',
      boxShadowTertiary: 'none',
    },
    Table: {
      borderRadius: 8,
      headerBg: modernColors.neutral[50],
      headerColor: modernColors.neutral[700],
    },
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: modernColors.neutral[50],
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: modernColors.primary[50],
      itemSelectedColor: modernColors.primary[600],
      itemHoverBg: modernColors.neutral[50],
      itemHoverColor: modernColors.neutral[800],
      itemColor: modernColors.neutral[700],
      darkItemBg: 'transparent',
      darkItemSelectedBg: modernColors.primary[600],
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: modernColors.neutral[700],
      darkItemHoverColor: '#ffffff',
    },
    Spin: {
      colorPrimary: modernColors.primary[500],
      dotSizeLG: 24,
      dotSize: 20,
      dotSizeSM: 16,
    },
    Drawer: {
      borderRadius: 0,
      boxShadow: 'none',
    },
    Modal: {
      borderRadius: 12,
      boxShadow: 'none',
    },
    Message: {
      borderRadius: 8,
      boxShadow: 'none',
    },
    Notification: {
      borderRadius: 8,
      boxShadow: 'none',
    },
    Dropdown: {
      boxShadow: 'none',
    },
    Popover: {
      boxShadow: 'none',
    },
    Tooltip: {
      boxShadow: 'none',
    },
    Select: {
      boxShadow: 'none',
      optionSelectedBg: modernColors.primary[50],
    },
    DatePicker: {
      boxShadow: 'none',
    },
    Input: {
      borderRadius: 8,
      paddingBlock: 8,
      paddingInline: 12,
      boxShadow: 'none',
      activeShadow: 'none',
    },
  },
  algorithm: theme.defaultAlgorithm,
};

/**
 * Dark theme configuration
 */
const darkTheme = {
  token: {
    // Base font size for mobile-first design (prevents auto-zoom)
    fontSize: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", sans-serif',

    // Brand colors (adjusted for dark theme)
    colorPrimary: modernColors.primary[400],
    colorSuccess: modernColors.success[400],
    colorWarning: modernColors.warning[400],
    colorError: modernColors.error[400],
    colorInfo: modernColors.primary[300],

    // Background colors
    colorBgContainer: modernColors.neutral[800],
    colorBgLayout: modernColors.neutral[900],
    colorBgElevated: modernColors.neutral[700],
    colorBgSpotlight: modernColors.neutral[700],
    colorBgMask: 'rgba(0, 0, 0, 0.65)',

    // Text colors
    colorText: modernColors.neutral[100],
    colorTextSecondary: modernColors.neutral[300],
    colorTextTertiary: modernColors.neutral[400],
    colorTextQuaternary: modernColors.neutral[500],

    // Border colors
    colorBorder: modernColors.neutral[600],
    colorBorderSecondary: modernColors.neutral[700],

    // Component specific colors
    colorFillAlter: modernColors.neutral[700],
    colorFillSecondary: modernColors.neutral[600],
    colorFillTertiary: modernColors.neutral[500],
    colorFillQuaternary: modernColors.neutral[400],

    // Interactive states
    colorPrimaryHover: modernColors.primary[300],
    colorPrimaryActive: modernColors.primary[500],
    colorPrimaryBorder: modernColors.primary[600],
    colorPrimaryBorderHover: modernColors.primary[500],

    // Spacing and sizing (same as light)
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    controlHeightXS: 24,

    marginLG: 24,
    marginMD: 16,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,

    paddingLG: 24,
    paddingMD: 16,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,

    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',

    // Box shadow (disabled for clean, flat design)
    boxShadow: 'none',
    boxShadowSecondary: 'none',
    boxShadowTertiary: 'none',
  },
  components: {
    Button: {
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
      ghostShadow: 'none',
      // Ensure button text is visible in dark mode
      primaryColor: '#ffffff',
      defaultColor: modernColors.neutral[100],
    },
    Input: {
      borderRadius: 8,
      paddingBlock: 8,
      paddingInline: 12,
      boxShadow: 'none',
      activeShadow: 'none',
      colorText: modernColors.neutral[100],
      colorTextPlaceholder: modernColors.neutral[400],
    },
    Card: {
      borderRadius: 12,
      paddingLG: 24,
      boxShadow: 'none',
      boxShadowTertiary: 'none',
    },
    Table: {
      borderRadius: 8,
      headerBg: modernColors.neutral[700],
      headerColor: modernColors.neutral[200],
      colorText: modernColors.neutral[100],
    },
    Layout: {
      siderBg: modernColors.neutral[900],
      headerBg: modernColors.neutral[800],
      bodyBg: modernColors.neutral[900],
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: modernColors.primary[600],
      itemSelectedColor: '#ffffff',
      itemHoverBg: modernColors.neutral[700],
      itemHoverColor: modernColors.neutral[100],
      darkItemBg: 'transparent',
      darkItemSelectedBg: modernColors.primary[600],
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: modernColors.neutral[700],
      darkItemHoverColor: '#ffffff',
    },
    Spin: {
      colorPrimary: modernColors.primary[400],
      dotSizeLG: 24,
      dotSize: 20,
      dotSizeSM: 16,
      // Ensure spinner is visible in dark mode
      colorText: modernColors.primary[400],
    },
    Drawer: {
      borderRadius: 0,
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[800],
    },
    Modal: {
      borderRadius: 12,
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[800],
    },
    Message: {
      borderRadius: 8,
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[700],
      colorText: modernColors.neutral[100],
    },
    Notification: {
      borderRadius: 8,
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[700],
    },
    Dropdown: {
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[700],
    },
    Popover: {
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[700],
    },
    Tooltip: {
      boxShadow: 'none',
      colorBgSpotlight: modernColors.neutral[600],
      colorTextLightSolid: modernColors.neutral[100],
    },
    Select: {
      boxShadow: 'none',
      optionSelectedBg: modernColors.primary[600],
      colorBgElevated: modernColors.neutral[700],
    },
    DatePicker: {
      boxShadow: 'none',
      colorBgElevated: modernColors.neutral[700],
    },
    Form: {
      colorText: modernColors.neutral[100],
      colorTextSecondary: modernColors.neutral[300],
    },
    Typography: {
      colorText: modernColors.neutral[100],
      colorTextSecondary: modernColors.neutral[300],
      colorTextTertiary: modernColors.neutral[400],
    },
  },
  algorithm: theme.darkAlgorithm,
};

/**
 * Theme persistence utilities
 */
const THEME_STORAGE_KEY = 'entix-theme-mode';

export const getStoredTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const setStoredTheme = (theme: 'light' | 'dark'): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Update body class for theme-aware styling
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
  }
};

export const themeConfig = {
  light: lightTheme,
  dark: darkTheme,
  colors: modernColors,
};

export default themeConfig;
