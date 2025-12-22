import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";

export const usersTable = sqliteTable("users", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
});

export const userInsertSchema = createInsertSchema(usersTable);

export const userCreateSchema = createInsertSchema(usersTable, {
    username: (s) => z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore"),
    email: (s) => z.email(),
    password: () => z.string().min(8).max(200),
}).omit({
    id: true,
});

export const userSelectSchema = createSelectSchema(usersTable).omit({
    password: true,
});

export type UserPublic = z.infer<typeof userSelectSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
