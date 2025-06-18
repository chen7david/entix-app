import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timeStamps } from '@database/helpers/schema.helper';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  sub: uuid('sub').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  disabledAt: timestamp('disabled_at').default(sql`NULL`),
  ...timeStamps,
});

// Helper function to handle soft deletes in queries
export const notDeletedUser = () => sql`${users.deletedAt} IS NULL`;
