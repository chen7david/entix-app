import { users } from '@database/schemas/user.schema';
import { roles } from '@database/schemas/role.schema';
import { pgTable, uuid, primaryKey, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    deletedAt: timestamp('deleted_at').default(sql`NULL`),
  },
  table => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    uniqueIndex('user_roles_userId_roleId_active_unique')
      .on(table.userId, table.roleId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const userRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));
