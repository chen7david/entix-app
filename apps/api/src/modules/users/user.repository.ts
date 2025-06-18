import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { InternalError } from '@repo/api-errors';
import { users, notDeleted } from '@modules/users/user.schema';
import { NewUser, User } from '@modules/users/user.model';
import { eq, and } from 'drizzle-orm';
import { userRoles } from '@modules/user_roles/user_role.shema';
import { roles } from '@modules/roles/role.shema';

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DbService) {}

  async findAll(trx = this.dbService.db): Promise<User[]> {
    return trx.select().from(users).where(notDeleted());
  }

  async findById(id: string, trx = this.dbService.db): Promise<User | undefined> {
    const [user] = await trx
      .select()
      .from(users)
      .where(and(eq(users.id, id), notDeleted()))
      .limit(1);
    return user;
  }

  async findByCognitoSub(sub: string, trx = this.dbService.db): Promise<User | undefined> {
    const [user] = await trx
      .select()
      .from(users)
      .where(and(eq(users.sub, sub), notDeleted()))
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
}
