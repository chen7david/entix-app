import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { CreateRoleResult, NewRole, Role, RoleUpdate } from './role.model';
import { notDeletedRole, roles } from '../../database/schemas/role.schema';
import { and, eq } from 'drizzle-orm';
import { isEmptyObject } from '@utils/check.util';
import { NotFoundError } from '@repo/api-errors';

@Injectable()
export class RoleRepository {
  constructor(private readonly dbService: DbService) {}

  async findAll(trx = this.dbService.db): Promise<Role[]> {
    return trx.select().from(roles).where(notDeletedRole());
  }

  async findById(id: string, trx = this.dbService.db): Promise<Role | undefined> {
    const [role] = await trx.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async findByName(name: string, trx = this.dbService.db): Promise<Role | undefined> {
    const [role] = await trx.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async create(params: NewRole, trx = this.dbService.db): Promise<CreateRoleResult> {
    console.log('params', params);
    const [role] = await trx.insert(roles).values(params).returning();
    if (!role) {
      throw new Error('Failed to create role');
    }
    return role;
  }

  async update(id: string, params: RoleUpdate, trx = this.dbService.db): Promise<Role> {
    if (isEmptyObject(params)) throw new Error('No fields to update');

    const [role] = await trx.update(roles).set(params).where(eq(roles.id, id)).returning();
    if (!role) {
      throw new Error('Failed to update role');
    }
    return role;
  }

  async delete(id: string, trx = this.dbService.db): Promise<boolean> {
    const result = await trx
      .update(roles)
      .set({ deletedAt: new Date() })
      .where(and(eq(roles.id, id), notDeletedRole()));
    if (result.rowCount === 0) {
      throw new NotFoundError('Role not found');
    }
    return true;
  }
}
