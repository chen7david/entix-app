import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const financialCurrencies = sqliteTable("financial_currencies", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(), // ISO 4217
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export type FinancialCurrency = typeof financialCurrencies.$inferSelect;
export type NewFinancialCurrency = typeof financialCurrencies.$inferInsert;
