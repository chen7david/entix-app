import { userRoles } from './user_role.shema';
import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class UserRoleRepository {
  constructor(private readonly dbService: DbService) {}

  async relate(userId: string, roleId: string, trx = this.dbService.db) {
    return trx.insert(userRoles).values({ userId, roleId }).returning();
  }

  async unrelate(userId: string, roleId: string, trx = this.dbService.db) {
    return trx.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }
}
