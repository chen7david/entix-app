import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timeStamps } from '@database/helpers/schema.helper';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  ...timeStamps,
});

export const notDeletedRole = () => sql`${roles.deletedAt} IS NULL`;
