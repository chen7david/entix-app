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

    // JSON-stringified array of currency IDs, e.g., '["fcur_etd", "fcur_cny"]'
    autoProvisionCurrencies: text("auto_provision_currencies")
        .notNull()
        .default(`["${FINANCIAL_CURRENCIES.ETD}", "${FINANCIAL_CURRENCIES.CNY}"]`),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .notNull()
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export type FinancialOrgSettings = typeof financialOrgSettings.$inferSelect;
export type NewFinancialOrgSettings = typeof financialOrgSettings.$inferInsert;
