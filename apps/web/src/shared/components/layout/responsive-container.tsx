import { Row, Col } from 'antd';
import type { ReactNode } from 'react';

/**
 * Responsive container props
 */
export interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: string;
  padding?: string;
  centered?: boolean;
}

/**
 * Responsive container component for mobile-friendly layouts
 */
export const ResponsiveContainer = ({
  children,
  maxWidth = '1200px',
  padding = '16px',
  centered = true,
}: ResponsiveContainerProps) => {
  return (
    <Row justify={centered ? 'center' : 'start'}>
      <Col
        xs={24}
        sm={22}
        md={20}
        lg={18}
        xl={16}
        style={{
          maxWidth,
          padding,
          width: '100%',
        }}
      >
        {children}
      </Col>
    </Row>
  );
};
