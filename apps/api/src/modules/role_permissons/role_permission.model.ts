import { rolePermissions } from '@database/schemas/role_permission.schema';
import { Permission } from '@modules/permissions/permission.model';
import { Role } from '@modules/roles/role.model';

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type RolePermissionUpdate = Partial<Omit<NewRolePermission, 'id'>>;

export type CreateRolePermissionParams = {
  roleId: string;
  permissionId: string;
};

export type CreateRolePermissionResult = {
  success: boolean;
};

export type DeleteRolePermissionParams = {
  roleId: string;
  permissionId: string;
};

export type DeleteRolePermissionResult = {
  success: boolean;
};

export type FindRolePermissionsParams = {
  roleId: string;
};

export type FindRolePermissionsResult = Permission[];

export type FindPermissionRolesParams = {
  permissionId: string;
};

export type FindPermissionRolesResult = Role[];
