import { z } from "@hono/zod-openapi";

/**
 * Rate tier for a billing plan.
 */
export const billingPlanRateSchema = z.object({
    id: z.string(),
    billingPlanId: z.string(),
    participantCount: z.number().int().nonnegative(),
    rateCentsPerMinute: z.number().int().nonnegative(),
    createdAt: z.union([z.string(), z.date(), z.number()]),
    updatedAt: z.union([z.string(), z.date(), z.number()]),
});

export type BillingPlanRateDTO = z.infer<typeof billingPlanRateSchema>;

/**
 * Core Billing Plan Schema
 */
export const billingPlanSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().nullable(),
    currencyId: z.string(),
    isActive: z.boolean(),
    rates: z.array(billingPlanRateSchema).optional(),
    createdAt: z.union([z.string(), z.date(), z.number()]),
    updatedAt: z.union([z.string(), z.date(), z.number()]),
});

export type BillingPlanDTO = z.infer<typeof billingPlanSchema>;

/**
 * Member Billing Plan Assignment Schema
 */
export const memberBillingPlanSchema = z.object({
    id: z.string(),
    userId: z.string(),
    organizationId: z.string(),
    billingPlanId: z.string(),
    currencyId: z.string(),
    assignedAt: z.union([z.string(), z.date(), z.number()]),
    assignedBy: z.string().nullable(),
});

// For public consumption, we can alias billingPlanId to planId
export const memberBillingPlanDTOSchema = memberBillingPlanSchema
    .extend({
        planId: z.string(),
    })
    .omit({ billingPlanId: true });

export type MemberBillingPlanDTO = z.infer<typeof memberBillingPlanDTOSchema>;

/**
 * Request Schemas
 */
export const createBillingPlanSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    currencyId: z.string().min(1),
    rates: z
        .array(
            z.object({
                participantCount: z.number().int().nonnegative(),
                rateCentsPerMinute: z.number().int().nonnegative(),
            })
        )
        .min(1, "At least one rate tier must be defined"),
});

export const assignBillingPlanSchema = z.object({
    userId: z.string().min(1),
    planId: z.string().min(1),
});

/**
 * Pagination & Query Schemas
 */
export const billingPlanPaginationSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listBillingPlansResponseSchema = z.object({
    data: z.array(billingPlanSchema),
    nextCursor: z.string().nullable(),
});

export const listMemberBillingPlansResponseSchema = z.object({
    data: z.array(memberBillingPlanDTOSchema),
    nextCursor: z.string().nullable(),
});

export type CreateBillingPlanInput = z.infer<typeof createBillingPlanSchema>;
export type AssignBillingPlanInput = z.infer<typeof assignBillingPlanSchema>;
export type BillingPlanPaginationInput = z.infer<typeof billingPlanPaginationSchema>;
