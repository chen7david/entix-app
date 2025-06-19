import { notDeletedUserRole, userRoles } from '../../database/schemas/user_role.shema';
import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { DeleteUserRoleParams, NewUserRole } from './user_role.model';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Role, User } from '@repo/entix-sdk';
import { roles } from '@database/schemas/role.schema';
import { users } from '@database/schemas/user.schema';
import { InternalError, NotFoundError } from '@repo/api-errors';

@Injectable()
export class UserRoleRepository {
  constructor(private readonly dbService: DbService) {}

  async createUserRole(params: NewUserRole, trx = this.dbService.db): Promise<boolean> {
    const [userRole] = await trx.insert(userRoles).values(params).returning();
    if (!userRole) {
      throw new InternalError('Failed to create user role');
    }
    return true;
  }

  async deleteUserRole(params: DeleteUserRoleParams, trx = this.dbService.db): Promise<boolean> {
    const [userRole] = await trx
      .update(userRoles)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(userRoles.userId, params.userId), eq(userRoles.roleId, params.roleId), isNull(userRoles.deletedAt)))
      .returning();
    if (!userRole) {
      throw new NotFoundError('User role not found');
    }
    return true;
  }

  async findUserRoles(userId: string, trx = this.dbService.db): Promise<Role[]> {
    const results = await trx
      .select({
        ...getTableColumns(roles),
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, userId), notDeletedUserRole()));

    return results;
  }

  async findRoleUsers(roleId: string, trx = this.dbService.db): Promise<User[]> {
    const results = await trx
      .select({
        ...getTableColumns(users),
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(and(eq(userRoles.roleId, roleId), notDeletedUserRole()));

    return results;
  }
}
