import { userRoles } from '../../database/schemas/user_role.shema';
import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { DeleteUserRoleParams, NewUserRole, UserRole } from './user_role.model';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { Role, User } from '@repo/entix-sdk';
import { roles } from '@database/schemas/role.schema';
import { users } from '@database/schemas/user.schema';

@Injectable()
export class UserRoleRepository {
  constructor(private readonly dbService: DbService) {}

  async createUserRole(params: NewUserRole, trx = this.dbService.db): Promise<UserRole> {
    const [userRole] = await trx.insert(userRoles).values(params).returning();
    if (!userRole) {
      throw new Error('Failed to create user role');
    }
    return userRole;
  }

  async deleteUserRole(params: DeleteUserRoleParams, trx = this.dbService.db): Promise<boolean> {
    const result = await trx
      .delete(userRoles)
      .where(and(eq(userRoles.userId, params.userId), eq(userRoles.roleId, params.roleId)));
    if (result.rowCount === 0) {
      throw new Error('Failed to delete user role');
    }
    return result.rowCount !== null && result.rowCount > 0;
  }

  async findUserRoles(userId: string, trx = this.dbService.db): Promise<Role[]> {
    const results = await trx
      .select({
        ...getTableColumns(roles),
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return results;
  }

  async findRoleUsers(roleId: string, trx = this.dbService.db): Promise<User[]> {
    const results = await trx
      .select({
        ...getTableColumns(users),
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId));

    return results;
  }
}
