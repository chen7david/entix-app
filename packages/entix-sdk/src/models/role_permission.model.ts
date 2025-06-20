import { Permission } from './permission.model';
import { Role } from './role.model';

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type PermissionWithRoles = Permission & {
  roles: Role[];
};
