import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

/**
 * Loading spinner size types
 */
export type LoadingSpinnerSize = 'small' | 'default' | 'large';

/**
 * Loading spinner props
 */
export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  text?: string;
  children?: ReactNode;
  spinning?: boolean;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner = ({
  size = 'default',
  text = 'Loading...',
  children,
  spinning = true,
}: LoadingSpinnerProps) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 24 : size === 'small' ? 14 : 18 }} spin />;

  if (children) {
    return (
      <Spin indicator={antIcon} size={size} spinning={spinning} tip={text}>
        {children}
      </Spin>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        minHeight: '200px',
      }}
    >
      <Spin indicator={antIcon} size={size} tip={text} />
    </div>
  );
};
