import { Spin } from 'antd';
import { type CSSProperties } from 'react';

type LoadingSpinnerProps = {
  /** Size of the spinner */
  size?: 'small' | 'default' | 'large';
  /** Custom text to display */
  tip?: string;
  /** Whether to take full height */
  fullHeight?: boolean;
  /** Whether to take full screen */
  fullScreen?: boolean;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: CSSProperties;
};

/**
 * Centralized loading spinner component with proper positioning
 */
export const LoadingSpinner = ({
  size = 'default',
  tip = 'Loading...',
  fullHeight = false,
  fullScreen = false,
  className = '',
  style = {},
}: LoadingSpinnerProps) => {
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...(fullHeight && { minHeight: '100vh' }),
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--ant-color-bg-mask)',
      zIndex: 1000,
    }),
    ...style,
  };

  const spinStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    ...(fullScreen && {
      backgroundColor: 'var(--ant-color-bg-container)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }),
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={spinStyle}>
        <Spin size={size} />
        {tip && (
          <span
            style={{
              color: 'var(--ant-color-text-secondary)',
              fontSize: '14px',
              marginTop: '8px',
            }}
          >
            {tip}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Page-level loading component
 */
export const PageLoading = ({ tip = 'Loading page...' }: { tip?: string }) => (
  <LoadingSpinner size="large" tip={tip} fullHeight />
);

/**
 * Inline loading component for smaller areas
 */
export const InlineLoading = ({ tip = 'Loading...' }: { tip?: string }) => (
  <LoadingSpinner size="small" tip={tip} style={{ padding: '16px' }} />
);

/**
 * Overlay loading for full screen operations
 */
export const OverlayLoading = ({ tip = 'Processing...' }: { tip?: string }) => (
  <LoadingSpinner size="large" tip={tip} fullScreen />
);
