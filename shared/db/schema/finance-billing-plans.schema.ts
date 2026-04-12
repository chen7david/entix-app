import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { authUsers } from "./auth.schema";
import { financialCurrencies } from "./financial-currencies.schema";
import { authOrganizations } from "./organization.schema";

/**
 * Organizations can create multiple billing plans for the same currency.
 */
export const financeBillingPlans = sqliteTable(
    "finance_billing_plans",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        description: text("description"),
        currencyId: text("currency_id")
            .notNull()
            .references(() => financialCurrencies.id),
        isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        overdraftLimitCents: integer("overdraft_limit_cents").notNull().default(0),
    },
    (table) => [
        check("overdraft_limit_non_negative", sql`${table.overdraftLimitCents} >= 0`),
        index("idx_billing_plans_org_id").on(table.organizationId),
    ]
);

/**
 * Assigns a billing plan to a student.
 * Enforces one active billing plan per currency per organization for each user.
 */
export const financeMemberBillingPlans = sqliteTable(
    "finance_member_billing_plans",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => authUsers.id, { onDelete: "cascade" }),
        organizationId: text("organization_id")
            .notNull()
            .references(() => authOrganizations.id, { onDelete: "cascade" }),
        billingPlanId: text("billing_plan_id")
            .notNull()
            .references(() => financeBillingPlans.id, { onDelete: "restrict" }),
        // Denormalized for efficient deterministic lookup
        currencyId: text("currency_id")
            .notNull()
            .references(() => financialCurrencies.id),
        assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        assignedBy: text("assigned_by").references(() => authUsers.id),
    },
    (table) => [
        uniqueIndex("uq_member_billing_currency_per_org").on(
            table.userId,
            table.organizationId,
            table.currencyId
        ),
    ]
);

/**
 * Rates per participant count for a billing plan.
 */
export const financeBillingPlanRates = sqliteTable(
    "finance_billing_plan_rates",
    {
        id: text("id").primaryKey(),
        billingPlanId: text("billing_plan_id")
            .notNull()
            .references(() => financeBillingPlans.id, { onDelete: "cascade" }),
        participantCount: integer("participant_count").notNull(),
        rateCentsPerMinute: integer("rate_cents_per_minute").notNull(),
        createdAt: integer("created_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
            .notNull()
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    },
    (table) => [
        uniqueIndex("uq_plan_rate_participant_count").on(
            table.billingPlanId,
            table.participantCount
        ),
    ]
);

export type FinanceBillingPlan = typeof financeBillingPlans.$inferSelect;
export type NewFinanceBillingPlan = typeof financeBillingPlans.$inferInsert;

export type FinanceMemberBillingPlan = typeof financeMemberBillingPlans.$inferSelect;
export type NewFinanceMemberBillingPlan = typeof financeMemberBillingPlans.$inferInsert;

// Aliases for shorter repository usage
export type BillingPlan = FinanceBillingPlan;
export type NewBillingPlan = NewFinanceBillingPlan;
export type MemberBillingPlan = FinanceMemberBillingPlan;
export type NewMemberBillingPlan = NewFinanceMemberBillingPlan;

export type FinanceBillingPlanRate = typeof financeBillingPlanRates.$inferSelect;
export type NewFinanceBillingPlanRate = typeof financeBillingPlanRates.$inferInsert;

// Aliases for shorter repository usage
export type BillingPlanRate = FinanceBillingPlanRate;
export type NewBillingPlanRate = NewFinanceBillingPlanRate;
