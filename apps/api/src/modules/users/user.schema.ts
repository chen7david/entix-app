import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  sub: uuid('sub').notNull().unique(),

  email: varchar('email', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),

  disabledAt: timestamp('disabled_at').default(sql`NULL`),
  deletedAt: timestamp('deleted_at').default(sql`NULL`),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Helper function to handle soft deletes in queries
export const notDeleted = () => sql`${users.deletedAt} IS NULL`;
