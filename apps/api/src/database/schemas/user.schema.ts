import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timeStamps } from '@database/helpers/schema.helper';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sub: uuid('sub').notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    disabledAt: timestamp('disabled_at').default(sql`NULL`),
    ...timeStamps,
  },
  table => [
    // Ensure 'sub' is unique only for active users
    uniqueIndex('users_sub_active_unique')
      .on(table.sub)
      .where(sql`${table.disabledAt} IS NULL`),

    // Ensure 'username' is unique only for active users
    uniqueIndex('users_username_active_unique')
      .on(table.username)
      .where(sql`${table.disabledAt} IS NULL`),
  ],
);

export const notDeletedUser = () => sql`${users.disabledAt} IS NULL`;
