import { users } from '@database/schemas/user.schema';
import { roles } from '@database/schemas/role.schema';
import { pgTable, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { timeStamps } from '@database/helpers/schema.helper';
import { relations, sql } from 'drizzle-orm';

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),

    ...timeStamps,
  },
  table => [
    // Only one active (userId, roleId) pair allowed
    uniqueIndex('user_roles_userId_roleId_active_unique')
      .on(table.userId, table.roleId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

// Relations

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

export const notDeletedUserRole = () => sql`${userRoles.deletedAt} IS NULL`;
