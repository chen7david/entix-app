import { pgTable, timestamp, uuid, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').default(sql`NULL`),
  deletedAt: timestamp('deleted_at').default(sql`NULL`),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const notDeletedRole = () => sql`${roles.deletedAt} IS NULL`;
