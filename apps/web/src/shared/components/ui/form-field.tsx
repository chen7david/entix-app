import { Form, type FormItemProps } from 'antd';
import type { ReactNode } from 'react';

/**
 * Form field props interface
 */
export interface FormFieldProps extends Omit<FormItemProps, 'children'> {
  children: ReactNode;
  required?: boolean;
  helpText?: string;
}

/**
 * Reusable form field component with consistent styling and validation
 */
export const FormField = ({ children, required = false, helpText, rules = [], ...props }: FormFieldProps) => {
  // Add required rule if specified
  const fieldRules = required
    ? [{ required: true, message: `${props.label || 'This field'} is required` }, ...rules]
    : rules;

  return (
    <Form.Item {...props} rules={fieldRules} help={helpText}>
      {children}
    </Form.Item>
  );
};
