import { pgTable, uuid, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timeStamps } from '@database/helpers/schema.helper';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ...timeStamps,
  },
  table => [
    uniqueIndex('roles_name_active_unique')
      .on(table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const notDeletedRole = () => sql`${roles.deletedAt} IS NULL`;
