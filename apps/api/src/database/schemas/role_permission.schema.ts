import { pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { permissions } from './permission.schema';
import { timeStamps } from '@database/helpers/schema.helper';
import { roles } from './role.schema';
import { sql } from 'drizzle-orm';

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roleId: uuid('role_id').references(() => roles.id),
    permissionId: uuid('permission_id').references(() => permissions.id),
    ...timeStamps,
  },
  table => [
    uniqueIndex('role_permissions_role_id_permission_id_unique')
      .on(table.roleId, table.permissionId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const notDeletedRolePermission = () => sql`${rolePermissions.deletedAt} IS NULL`;
