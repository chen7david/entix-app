import { useMediaQuery } from 'react-responsive';

/**
 * Industry-standard breakpoints for responsive design
 * Based on modern design systems and common device sizes
 */
export const BREAKPOINTS = {
  xs: 480, // Extra small devices (phones)
  sm: 576, // Small devices (large phones)
  md: 768, // Medium devices (tablets)
  lg: 992, // Large devices (desktops)
  xl: 1200, // Extra large devices (large desktops)
  xxl: 1600, // Extra extra large devices
} as const;

/**
 * Responsive hook for detecting screen sizes
 * Provides better performance than window resize listeners
 */
export const useResponsive = () => {
  const isXs = useMediaQuery({ maxWidth: BREAKPOINTS.xs - 1 });
  const isSm = useMediaQuery({ minWidth: BREAKPOINTS.xs, maxWidth: BREAKPOINTS.sm - 1 });
  const isMd = useMediaQuery({ minWidth: BREAKPOINTS.sm, maxWidth: BREAKPOINTS.md - 1 });
  const isLg = useMediaQuery({ minWidth: BREAKPOINTS.md, maxWidth: BREAKPOINTS.lg - 1 });
  const isXl = useMediaQuery({ minWidth: BREAKPOINTS.lg, maxWidth: BREAKPOINTS.xl - 1 });
  const isXxl = useMediaQuery({ minWidth: BREAKPOINTS.xl });

  // Convenience properties
  const isMobile = useMediaQuery({ maxWidth: BREAKPOINTS.md - 1 });
  const isTablet = useMediaQuery({ minWidth: BREAKPOINTS.md, maxWidth: BREAKPOINTS.lg - 1 });
  const isDesktop = useMediaQuery({ minWidth: BREAKPOINTS.lg });
  const isSmallScreen = useMediaQuery({ maxWidth: BREAKPOINTS.sm - 1 });

  return {
    // Individual breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,

    // Convenience properties
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,

    // Current breakpoint
    breakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : 'xxl',
  };
};

/**
 * Hook for responsive layout decisions
 */
export const useResponsiveLayout = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return {
    // Sidebar behavior
    sidebarCollapsed: isMobile,
    sidebarWidth: isMobile ? 0 : 256,
    sidebarCollapsedWidth: isMobile ? 0 : 80,

    // Content layout
    contentPadding: isMobile ? '16px' : isTablet ? '24px' : '32px',
    maxContentWidth: isMobile ? '100%' : isTablet ? '100%' : '1400px',

    // Spacing
    spacing: {
      xs: isMobile ? 8 : 12,
      sm: isMobile ? 12 : 16,
      md: isMobile ? 16 : 24,
      lg: isMobile ? 24 : 32,
      xl: isMobile ? 32 : 48,
    },

    // Typography
    fontSize: {
      h1: isMobile ? '24px' : isTablet ? '28px' : '32px',
      h2: isMobile ? '20px' : isTablet ? '24px' : '28px',
      h3: isMobile ? '18px' : isTablet ? '20px' : '24px',
      body: isMobile ? '14px' : '16px',
      small: isMobile ? '12px' : '14px',
    },

    // Device type
    isMobile,
    isTablet,
    isDesktop,
  };
};
