import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

/**
 * Button size types
 */
export type ButtonSize = 'small' | 'middle' | 'large';

/**
 * Extended button props
 */
export interface CustomButtonProps extends Omit<AntdButtonProps, 'type' | 'variant'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

/**
 * Reusable button component with consistent styling and variants
 */
export const Button = ({
  variant = 'primary',
  size = 'middle',
  loading = false,
  children,
  disabled,
  icon,
  ...props
}: CustomButtonProps) => {
  // Map variant to Antd button type
  const getButtonType = (): AntdButtonProps['type'] => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'danger':
        return 'primary';
      case 'ghost':
        return 'text';
      case 'link':
        return 'link';
      default:
        return 'primary';
    }
  };

  // Get button styles based on variant
  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: '6px',
      fontWeight: 500,
    };

    switch (variant) {
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: '#ff4d4f',
          borderColor: '#ff4d4f',
          color: '#fff',
        };
      case 'secondary':
        return {
          ...baseStyles,
          borderColor: '#d9d9d9',
          color: '#595959',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <AntdButton
      type={getButtonType()}
      size={size}
      loading={loading}
      disabled={disabled || loading}
      icon={loading ? <LoadingOutlined /> : icon}
      style={getButtonStyles()}
      {...props}
    >
      {children}
    </AntdButton>
  );
};
