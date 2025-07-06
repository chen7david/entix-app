import type { User, CreateUserParamsDto, UpdateUserParamsDto } from '@repo/entix-sdk';

/**
 * Users state interface
 */
export type UsersState = {
  users: User[];
  isLoading: boolean;
  selectedUser: User | null;
};

/**
 * User form data interface
 */
export type UserFormData = CreateUserParamsDto;

/**
 * User update form data interface
 */
export type UserUpdateFormData = UpdateUserParamsDto;

/**
 * Users hook return type
 */
export type UseUsersReturn = {
  users: User[];
  isLoading: boolean;
  createUser: (userData: CreateUserParamsDto) => Promise<User>;
  updateUser: (id: string, userData: UpdateUserParamsDto) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  refetchUsers: () => void;
};

/**
 * User management hook return type
 */
export type UseUserManagementReturn = {
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  isCreateModalVisible: boolean;
  setIsCreateModalVisible: (visible: boolean) => void;
  isEditModalVisible: boolean;
  setIsEditModalVisible: (visible: boolean) => void;
  isDetailDrawerVisible: boolean;
  setIsDetailDrawerVisible: (visible: boolean) => void;
};
