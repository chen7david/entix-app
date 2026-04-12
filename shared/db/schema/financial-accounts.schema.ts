import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ACCOUNT_TYPES } from "../../constants/financial";
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
        accountType: text("account_type")
            .$type<"savings" | "funding" | "treasury" | "system">()
            .notNull()
            .default(ACCOUNT_TYPES.SAVINGS),
        overdraftLimitCents: integer("overdraft_limit_cents").notNull().default(0),
    },
    (t) => [
        check("owner_type_check", sql`${t.ownerType} IN ('user', 'org')`),
        check(
            "account_type_check",
            sql`${t.accountType} IN ('savings', 'funding', 'treasury', 'system')`
        ),
        check("balance_non_negative", sql`${t.balanceCents} >= 0`),
        check("overdraft_limit_non_negative", sql`${t.overdraftLimitCents} >= 0`),
        check("org_scoped_user_accounts", sql`${t.organizationId} IS NOT NULL`),
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
 * Repository input schema for financial accounts.
 * Explicitly overrides fields with DB defaults to be strictly REQUIRED
 * in the persistence layer (Rule 78/85).
 */
export const createAccountRepoInputSchema = createInsertSchema(financialAccounts, {
    id: z.string().min(1),
    ownerType: z.enum(["user", "org"]),
    accountType: z.enum(["savings", "funding", "treasury", "system"]),
    createdAt: z.date(),
    updatedAt: z.date(),
}).superRefine((data, ctx) => {
    if (!data.organizationId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "organizationId is required for all accounts",
            path: ["organizationId"],
        });
    }
});

export type CreateAccountRepoInput = z.infer<typeof createAccountRepoInputSchema>;

/**
 * Lean frontend type for financial account creation.
 * Derived from the DTO layer to isolate frontend from persistence fields.
 */
export type NewFinancialAccount = {
    name: string;
    currencyId: string;
    ownerId: string;
    ownerType: "user" | "org";
    organizationId?: string | null;
};
