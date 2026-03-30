import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const financialCurrencies = sqliteTable(
    "financial_currencies",
    {
        id: text("id").primaryKey(),
        code: text("code").notNull().unique().$type<string>(), // ISO 4217, typically 3 uppercase
        name: text("name").notNull(),
        symbol: text("symbol").notNull(),
        archivedAt: integer("archived_at", { mode: "timestamp_ms" }), // null = active
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        check("code_format", sql`length(${t.code}) = 3 AND ${t.code} = upper(${t.code})`),
        check("symbol_length", sql`length(${t.symbol}) <= 5`),
    ]
);

export type FinancialCurrency = typeof financialCurrencies.$inferSelect;
export type NewFinancialCurrency = Omit<
    typeof financialCurrencies.$inferInsert,
    "id" | "createdAt"
>;
