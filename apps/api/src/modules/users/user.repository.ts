import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { InternalError } from '@repo/api-errors';
import { users, notDeletedUser } from '@database/schemas/user.schema';
import { NewUser, User } from '@modules/users/user.model';
import { eq, and, isNull } from 'drizzle-orm';
import { userRoles } from '@database/schemas/user_role.shema';
import { roles } from '@database/schemas/role.schema';
import { permissions } from '@database/schemas/permission.schema';
import { rolePermissions } from '@database/schemas';

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DbService) {}

  async findAll(trx = this.dbService.db): Promise<User[]> {
    return trx.select().from(users).where(notDeletedUser());
  }

  async findById(id: string, trx = this.dbService.db): Promise<User | undefined> {
    const [user] = await trx
      .select()
      .from(users)
      .where(and(eq(users.id, id), notDeletedUser()))
      .limit(1);
    return user;
  }

  async findByCognitoSub(sub: string, trx = this.dbService.db): Promise<User | undefined> {
    const [user] = await trx
      .select()
      .from(users)
      .where(and(eq(users.sub, sub), notDeletedUser()))
      .limit(1);
    return user;
  }

  async createUser(params: NewUser, trx = this.dbService.db): Promise<User> {
    const [newUser] = await trx.insert(users).values(params).returning();
    if (!newUser) {
      throw new InternalError('Failed to create user');
    }
    return newUser;
  }

  async findRolesByUserId(userId: string, trx = this.dbService.db) {
    return trx
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id));
  }

  async findUserPermissions(userId: string, trx = this.dbService.db) {
    const result = await trx
      .selectDistinct({ permissionCode: permissions.permissionCode })
      .from(users)
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(users.id, userId), isNull(roles.deletedAt), isNull(permissions.deletedAt)))
      .execute();

    return result.map(row => row.permissionCode);
  }
}
