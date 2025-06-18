import { users } from '@modules/users/user.schema';
import { roles } from '@modules/roles/role.schema';
import { pgTable, uuid, primaryKey, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.userId, table.roleId] }), unique().on(table.userId)],
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
