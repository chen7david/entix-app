import { type ReactNode, type CSSProperties } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type ResponsiveContainerProps = {
  children: ReactNode;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: CSSProperties;
  /** Whether to add mobile padding */
  mobilePadding?: boolean;
  /** Maximum width of the container */
  maxWidth?: string | number;
  /** Whether to center the container */
  center?: boolean;
};

/**
 * ResponsiveContainer component that provides consistent mobile/desktop layout
 */
export const ResponsiveContainer = ({
  children,
  className = '',
  style = {},
  mobilePadding = true,
  maxWidth,
  center = false,
}: ResponsiveContainerProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

  const containerStyle: CSSProperties = {
    width: '100%',
    ...(maxWidth && { maxWidth }),
    ...(center && { margin: '0 auto' }),
    ...(mobilePadding && isMobile && { padding: '16px' }),
    ...(mobilePadding && isTablet && { padding: '20px' }),
    ...(mobilePadding && !isMobile && !isTablet && { padding: '24px' }),
    ...style,
  };

  const responsiveClassName = [
    className,
    isMobile ? 'mobile-container' : '',
    isTablet ? 'tablet-container' : '',
    !isMobile && !isTablet ? 'desktop-container' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={responsiveClassName} style={containerStyle}>
      {children}
    </div>
  );
};

/**
 * Page container with responsive padding and mobile optimizations
 */
export const PageContainer = ({ children, ...props }: ResponsiveContainerProps) => (
  <ResponsiveContainer
    {...props}
    style={{
      backgroundColor: 'var(--ant-color-bg-layout)',
      minHeight: '100vh',
      ...props.style,
    }}
  >
    {children}
  </ResponsiveContainer>
);

/**
 * Card container with responsive spacing
 */
export const CardContainer = ({ children, ...props }: ResponsiveContainerProps) => (
  <ResponsiveContainer
    {...props}
    style={{
      marginBottom: '16px',
      ...props.style,
    }}
  >
    {children}
  </ResponsiveContainer>
);
