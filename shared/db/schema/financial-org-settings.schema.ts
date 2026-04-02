import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { FINANCIAL_CURRENCIES } from "../../constants/financial";
import { authOrganizations } from "./organization.schema";

export const financialOrgSettings = sqliteTable("financial_org_settings", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
        .notNull()
        .unique()
        .references(() => authOrganizations.id),

    /**
     * JSON-stringified array of currency IDs, e.g., '["fcur_etd", "fcur_usd"]'
     *
     * @warning This default value is baked into the generated SQL migration at schema generation
     * time (i.e., the constant values are evaluated once when `drizzle-kit generate` runs).
     * If FINANCIAL_CURRENCIES constant values are ever changed or rotated, you MUST:
     * 1. Update this constant and regenerate the migration.
     * 2. Write a data migration script to update all existing rows that still hold the old default.
     * Failure to do so will cause new orgs to provision currencies that no longer exist in the seed.
     */
    autoProvisionCurrencies: text("auto_provision_currencies")
        .notNull()
        .default(`["${FINANCIAL_CURRENCIES.ETD}", "${FINANCIAL_CURRENCIES.USD}"]`),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export type FinancialOrgSettings = typeof financialOrgSettings.$inferSelect;
export type NewFinancialOrgSettings = typeof financialOrgSettings.$inferInsert;
