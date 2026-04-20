import { z } from "zod";
import { PaginationQuerySchema } from "../pagination.schema";

export const auditSeveritySchema = z.enum(["info", "warning", "error", "critical"]);

export const systemAuditEventSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    eventType: z.string(),
    severity: auditSeveritySchema,
    actorId: z.string().nullable(),
    subjectType: z.string(),
    subjectId: z.string(),
    message: z.string(),
    metadata: z.string().nullable(),
    acknowledgedAt: z.date().nullable(),
    acknowledgedBy: z.string().nullable(),
    createdAt: z.date(),
});

export const auditLogQuerySchema = PaginationQuerySchema.extend({
    organizationId: z.string().optional(),
    severity: auditSeveritySchema.optional(),
    eventType: z.string().optional(),
    actorId: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    unresolvedOnly: z.coerce.boolean().optional(),
});

export const paginatedAuditResponseSchema = z.object({
    items: z.array(
        systemAuditEventSchema.extend({
            hasAcknowledgement: z.boolean().optional(),
        })
    ),
    nextCursor: z.string().nullable(),
    prevCursor: z.string().nullable(),
});

export const retryMissedPaymentRequestSchema = z.object({
    eventId: z.string(),
    organizationId: z.string(),
});

export const retryMissedPaymentResponseSchema = z.object({
    success: z.boolean(),
    status: z.enum(["retried", "acknowledged", "failed"]),
    message: z.string(),
});

export const requeueFailedPaymentRequestSchema = z.object({
    eventId: z.string().min(1),
    organizationId: z.string().min(1),
});

export const requeueFailedPaymentResponseSchema = z.object({
    status: z.literal("queued"),
});
