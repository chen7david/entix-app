import { Result, Button } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

/**
 * Error result props interface
 */
export interface ErrorResultProps {
  /** Error status - defaults to 'error' */
  status?: 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500';
  /** Error title */
  title?: string;
  /** Error subtitle/description */
  subtitle?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Primary action button */
  primaryAction?: {
    text: string;
    onClick: () => void;
    loading?: boolean;
  };
  /** Secondary action button */
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  /** Additional content */
  extra?: ReactNode;
  /** Custom styling */
  style?: React.CSSProperties;
}

/**
 * Reusable error result component using Ant Design's Result
 * Provides consistent error handling across the application
 */
export const ErrorResult = ({
  status = 'error',
  title = 'Something went wrong',
  subtitle = 'An unexpected error occurred. Please try again.',
  icon,
  primaryAction,
  secondaryAction,
  extra,
  style,
}: ErrorResultProps) => {
  return (
    <Result
      status={status}
      title={title}
      subTitle={subtitle}
      icon={icon}
      extra={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {primaryAction && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={primaryAction.onClick}
              loading={primaryAction.loading}
            >
              {primaryAction.text}
            </Button>
          )}
          {secondaryAction && (
            <Button icon={<ArrowLeftOutlined />} onClick={secondaryAction.onClick}>
              {secondaryAction.text}
            </Button>
          )}
          {extra}
        </div>
      }
      style={style}
    />
  );
};

/**
 * Common error result configurations
 */
export const ErrorResults = {
  /**
   * Access denied error
   */
  AccessDenied: ({ onGoHome }: { onGoHome?: () => void }) => (
    <ErrorResult
      status="403"
      title="Access Denied"
      subtitle="You don't have permission to access this resource."
      primaryAction={{
        text: 'Go Home',
        onClick: onGoHome || (() => (window.location.href = '/')),
      }}
    />
  ),

  /**
   * Not found error
   */
  NotFound: ({ onGoBack, onGoHome }: { onGoBack?: () => void; onGoHome?: () => void }) => (
    <ErrorResult
      status="404"
      title="Page Not Found"
      subtitle="The page you're looking for doesn't exist."
      primaryAction={{
        text: 'Go Back',
        onClick: onGoBack || (() => window.history.back()),
      }}
      secondaryAction={
        onGoHome
          ? {
              text: 'Go Home',
              onClick: onGoHome,
            }
          : undefined
      }
    />
  ),

  /**
   * Server error
   */
  ServerError: ({ onRetry }: { onRetry?: () => void }) => (
    <ErrorResult
      status="500"
      title="Server Error"
      subtitle="Something went wrong on our end. Please try again later."
      primaryAction={
        onRetry
          ? {
              text: 'Try Again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  ),

  /**
   * Network error
   */
  NetworkError: ({ onRetry }: { onRetry?: () => void }) => (
    <ErrorResult
      status="error"
      title="Network Error"
      subtitle="Unable to connect to the server. Please check your internet connection."
      primaryAction={
        onRetry
          ? {
              text: 'Retry',
              onClick: onRetry,
            }
          : undefined
      }
    />
  ),

  /**
   * Empty state
   */
  Empty: ({
    title = 'No Data Found',
    subtitle = 'There are no items to display.',
    onRefresh,
    onAdd,
  }: {
    title?: string;
    subtitle?: string;
    onRefresh?: () => void;
    onAdd?: () => void;
  }) => (
    <ErrorResult
      status="info"
      title={title}
      subtitle={subtitle}
      primaryAction={
        onAdd
          ? {
              text: 'Add New',
              onClick: onAdd,
            }
          : undefined
      }
      secondaryAction={
        onRefresh
          ? {
              text: 'Refresh',
              onClick: onRefresh,
            }
          : undefined
      }
    />
  ),
};
