import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { InternalError } from '@repo/api-errors';
import { users, notDeleted } from '@modules/users/user.schema';
import { NewUser, User } from '@modules/users/user.model';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DbService) {}

  async findAll(): Promise<User[]> {
    return this.dbService.db.select().from(users).where(notDeleted());
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), notDeleted()))
      .limit(1);
    return user[0] ?? null;
  }

  async createUser(user: NewUser): Promise<User> {
    const [newUser] = await this.dbService.db.insert(users).values(user).returning();
    if (!newUser) {
      throw new InternalError('Failed to create user');
    }
    return newUser;
  }
}
