import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { financialCurrencies } from "./financial-currencies.schema";
import { authOrganizations } from "./organization.schema";

export const financialAccounts = sqliteTable(
    "financial_accounts",
    {
        id: text("id").primaryKey(),
        ownerId: text("owner_id").notNull(),
        ownerType: text("owner_type").notNull().$type<"user" | "org">(),
        currencyId: text("currency_id")
            .notNull()
            .references(() => financialCurrencies.id),
        organizationId: text("organization_id").references(() => authOrganizations.id),
        name: text("name").notNull(),
        balanceCents: integer("balance_cents").notNull().default(0),
        isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
        archivedAt: integer("archived_at", { mode: "timestamp_ms" }).default(sql`NULL`),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (t) => [
        check("owner_type_check", sql`${t.ownerType} IN ('user', 'org')`),
        check("balance_non_negative", sql`${t.balanceCents} >= 0`),
        check(
            "org_scoped_user_accounts",
            sql`(${t.ownerType} = 'org' AND ${t.organizationId} IS NULL) OR (${t.ownerType} = 'user' AND ${t.organizationId} IS NOT NULL)`
        ),
        uniqueIndex("owner_org_name_currency_idx").on(
            t.ownerId,
            t.organizationId,
            t.name,
            t.currencyId
        ),
    ]
);

export type FinancialAccount = typeof financialAccounts.$inferSelect;

/**
 * Tight insert type for financial accounts.
 * Omit auto-generated and default fields to ensure callers only provide essential data.
 */
export type NewFinancialAccount = Omit<
    typeof financialAccounts.$inferInsert,
    "id" | "createdAt" | "updatedAt" | "balanceCents" | "isActive" | "archivedAt"
>;
