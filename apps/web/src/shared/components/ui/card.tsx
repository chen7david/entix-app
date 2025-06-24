import { Card as AntdCard, type CardProps as AntdCardProps } from 'antd';
import type { ReactNode } from 'react';

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

/**
 * Extended card props
 */
export interface CustomCardProps extends Omit<AntdCardProps, 'size' | 'variant'> {
  variant?: CardVariant;
  children: ReactNode;
}

/**
 * Reusable card component with consistent styling and variants
 */
export const Card = ({ variant = 'default', children, style, ...props }: CustomCardProps) => {
  // Get card styles based on variant
  const getCardStyles = () => {
    const baseStyles = {
      borderRadius: '8px',
      border: '1px solid var(--ant-color-border)',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: 'none',
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      case 'ghost':
        return {
          ...baseStyles,
          border: 'none',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        };
      default:
        return baseStyles;
    }
  };

  return (
    <AntdCard style={{ ...getCardStyles(), ...style }} {...props}>
      {children}
    </AntdCard>
  );
};
