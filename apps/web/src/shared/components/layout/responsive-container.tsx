import { Row, Col } from 'antd';
import type { ReactNode } from 'react';
import { useResponsiveLayout } from '@/shared/hooks/useResponsive';

/**
 * Responsive container props
 */
export interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: string;
  padding?: string;
  centered?: boolean;
  fluid?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Modern responsive container component for mobile-friendly layouts
 * Uses industry-standard responsive design patterns
 */
export const ResponsiveContainer = ({
  children,
  maxWidth,
  padding,
  centered = true,
  fluid = false,
  className,
  style,
}: ResponsiveContainerProps) => {
  const { maxContentWidth, contentPadding } = useResponsiveLayout();

  // Use provided props or responsive defaults
  const containerMaxWidth = maxWidth || (fluid ? '100%' : maxContentWidth);
  const containerPadding = padding || contentPadding;

  return (
    <Row
      justify={centered ? 'center' : 'start'}
      className={className}
      style={{
        margin: 0,
        padding: 0,
        width: '100%',
        ...style,
      }}
    >
      <Col
        xs={24}
        sm={fluid ? 24 : 22}
        md={fluid ? 24 : 20}
        lg={fluid ? 24 : 18}
        xl={fluid ? 24 : 16}
        style={{
          maxWidth: containerMaxWidth,
          padding: containerPadding,
          width: '100%',
          margin: 0,
        }}
      >
        {children}
      </Col>
    </Row>
  );
};

/**
 * Page container with consistent spacing and responsive behavior
 */
export const PageContainer = ({
  children,
  title,
  subtitle,
  extra,
  className,
  style,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  extra?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { spacing, fontSize, isMobile } = useResponsiveLayout();

  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--ant-color-bg-layout)',
        padding: `${spacing.lg}px 0 ${isMobile ? '80px' : spacing.lg}px 0`,
        ...style,
      }}
    >
      <ResponsiveContainer>
        {(title || subtitle || extra) && (
          <div
            style={{
              marginBottom: spacing.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: spacing.md,
              }}
            >
              <div>
                {title && (
                  <h1
                    style={{
                      fontSize: fontSize.h1,
                      fontWeight: 600,
                      margin: 0,
                      color: 'var(--ant-color-text)',
                      lineHeight: 1.2,
                    }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p
                    style={{
                      fontSize: fontSize.body,
                      color: 'var(--ant-color-text-secondary)',
                      margin: title ? `${spacing.xs}px 0 0 0` : 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              {extra && <div style={{ flexShrink: 0 }}>{extra}</div>}
            </div>
          </div>
        )}
        {children}
      </ResponsiveContainer>
    </div>
  );
};
