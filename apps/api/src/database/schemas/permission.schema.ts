import { pgTable, uuid, text, uniqueIndex, integer } from 'drizzle-orm/pg-core';
import { timeStamps } from '@database/helpers/schema.helper';
import { sql } from 'drizzle-orm';

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    permissionCode: integer('permission_code').notNull(),
    description: text('description'),
    ...timeStamps,
  },
  table => [
    uniqueIndex('permissions_name_active_unique')
      .on(table.name)
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex('permissions_permission_code_active_unique')
      .on(table.permissionCode)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const notDeletedPermission = () => sql`${permissions.deletedAt} IS NULL`;
