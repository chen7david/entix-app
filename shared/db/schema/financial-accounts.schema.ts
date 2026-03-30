import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { financialCurrencies } from "./financial-currencies.schema";

export const financialAccounts = sqliteTable("financial_accounts", {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    ownerType: text("owner_type").notNull(), // CHECK(owner_type IN ('user', 'org'))
    currencyId: text("currency_id")
        .notNull()
        .references(() => financialCurrencies.id),
    name: text("name").notNull(),
    balanceCents: integer("balance_cents").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type NewFinancialAccount = typeof financialAccounts.$inferInsert;
