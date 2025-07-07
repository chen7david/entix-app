import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { notDeletedRolePermission, rolePermissions } from '@database/schemas/role_permission.schema';
import { DeleteRolePermissionParams, NewRolePermission } from './role_permission.model';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { InternalError, NotFoundError } from '@repo/api-errors';
import { permissions, notDeletedPermission } from '@database/schemas/permission.schema';
import { roles, notDeletedRole } from '@database/schemas/role.schema';
import { Permission } from '@modules/permissions/permission.model';
import { Role } from '@modules/roles/role.model';

@Injectable()
export class RolePermissionRepository {
  constructor(private readonly dbService: DbService) {}

  async createRolePermission(params: NewRolePermission, trx = this.dbService.db): Promise<boolean> {
    const [rolePermission] = await trx.insert(rolePermissions).values(params).returning();
    if (!rolePermission) {
      throw new InternalError('Failed to create role permission');
    }
    return true;
  }

  async deleteRolePermission(params: DeleteRolePermissionParams, trx = this.dbService.db): Promise<boolean> {
    const [rolePermission] = await trx
      .update(rolePermissions)
      .set({
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(rolePermissions.roleId, params.roleId),
          eq(rolePermissions.permissionId, params.permissionId),
          isNull(rolePermissions.deletedAt),
        ),
      )
      .returning();
    if (!rolePermission) {
      throw new NotFoundError('Role permission not found');
    }
    return true;
  }

  async findRolePermissions(roleId: string, trx = this.dbService.db): Promise<Permission[]> {
    const results = await trx
      .select({
        ...getTableColumns(permissions),
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(and(eq(rolePermissions.roleId, roleId), notDeletedRolePermission(), notDeletedPermission()));

    return results;
  }

  async findPermissionRoles(permissionId: string, trx = this.dbService.db): Promise<Role[]> {
    const results = await trx
      .select({
        ...getTableColumns(roles),
      })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .where(and(eq(rolePermissions.permissionId, permissionId), notDeletedRolePermission(), notDeletedRole()));

    return results;
  }
}
