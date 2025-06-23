/**
 * Shared Types
 * Common TypeScript types used across the application
 */

// Re-export SDK types
export type {
  User,
  Role,
  Permission,
  CreateRoleParamsDto,
  UpdateRoleParamsDto,
  CreatePermissionParamsDto,
  UpdatePermissionParamsDto,
  CreateRolePermissionParamsDto,
  // Auth DTOs
  LoginDto,
  SignUpDto,
  ConfirmSignUpDto,
  ForgotPasswordDto,
  ConfirmForgotPasswordDto,
  LoginResultDto,
  SignUpResultDto,
  // User DTOs
  CreateUserParamsDto,
  UpdateUserParamsDto,
} from '@repo/entix-sdk';

// Export PermissionCode as a value, not a type
export { PermissionCode } from '@repo/entix-sdk';

// Common application types
export interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  responsive?: string[];
}

export interface ModalProps {
  visible: boolean;
  onCancel: () => void;
}

export interface FormValues {
  [key: string]: string | number | boolean | undefined;
}
