import { Injectable } from '@utils/typedi.util';
import { DbService } from '@services/db.service';
import { CreatePermissionResult, NewPermission, Permission, PermissionUpdate } from './permission.model';
import { notDeletedPermission, permissions } from '@database/schemas/permission.schema';
import { and, eq } from 'drizzle-orm';
import { isEmptyObject } from '@utils/check.util';
import { BadRequestError, InternalError, NotFoundError } from '@repo/api-errors';

@Injectable()
export class PermissionRepository {
  constructor(private readonly dbService: DbService) {}

  async findAll(trx = this.dbService.db): Promise<Permission[]> {
    return trx.select().from(permissions).where(notDeletedPermission());
  }

  async findById(id: string, trx = this.dbService.db): Promise<Permission | undefined> {
    const [permission] = await trx
      .select()
      .from(permissions)
      .where(and(eq(permissions.id, id), notDeletedPermission()));
    return permission;
  }

  async findByName(name: string, trx = this.dbService.db): Promise<Permission | undefined> {
    const [permission] = await trx
      .select()
      .from(permissions)
      .where(and(eq(permissions.name, name), notDeletedPermission()));
    return permission;
  }

  async findByPermissionCode(permissionCode: number, trx = this.dbService.db): Promise<Permission | undefined> {
    const [permission] = await trx
      .select()
      .from(permissions)
      .where(and(eq(permissions.permissionCode, permissionCode), notDeletedPermission()));
    return permission;
  }

  async create(params: NewPermission, trx = this.dbService.db): Promise<CreatePermissionResult> {
    const [permission] = await trx.insert(permissions).values(params).returning();
    if (!permission) {
      throw new InternalError('Failed to create permission');
    }
    return permission;
  }

  async update(id: string, params: PermissionUpdate, trx = this.dbService.db): Promise<Permission> {
    if (isEmptyObject(params)) throw new BadRequestError('No fields to update');

    const [permission] = await trx
      .update(permissions)
      .set(params)
      .where(and(eq(permissions.id, id), notDeletedPermission()))
      .returning();
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }
    return permission;
  }

  async delete(id: string, trx = this.dbService.db): Promise<boolean> {
    const result = await trx
      .update(permissions)
      .set({ deletedAt: new Date() })
      .where(and(eq(permissions.id, id), notDeletedPermission()));
    if (result.rowCount === 0) {
      throw new NotFoundError('Permission not found');
    }
    return true;
  }
}
