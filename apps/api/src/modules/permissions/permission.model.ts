import { permissions } from '@database/schemas/permission.schema';

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type PermissionUpdate = Partial<Omit<NewPermission, 'id'>>;

export type CreatePermissionParams = {
  name: string;
  permissionCode: number;
  description?: string;
};

export type CreatePermissionResult = Permission;

export type FindPermissionByIdParams = {
  id: string;
};

export type FindPermissionByIdResult = Permission;

export type FindAllPermissionsResult = Permission[];

export type UpdatePermissionParams = {
  name?: string;
  permissionCode?: number;
  description?: string | null;
};

export type UpdatePermissionResult = Permission;

export type DeletePermissionParams = {
  id: string;
};

export type DeletePermissionResult = {
  success: boolean;
};
