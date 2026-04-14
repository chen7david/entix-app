import { HttpMethods, HttpStatusCodes, jsonContent } from "@api/helpers/http.helpers";
import { requireInternalSecret } from "@api/middleware/internal-secret.middleware";
import { createRoute } from "@hono/zod-openapi";
import {
    auditLogQuerySchema,
    paginatedAuditResponseSchema,
    retryMissedPaymentRequestSchema,
    retryMissedPaymentResponseSchema,
} from "@shared/schemas/dto/audit.dto";

const tags = ["Internal"];

export const ReconciliationRoutes = {
    listMissedPayments: createRoute({
        tags,
        method: HttpMethods.GET,
        path: "/internal/billing/missed-payments",
        middleware: [requireInternalSecret] as const,
        request: {
            query: auditLogQuerySchema,
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                paginatedAuditResponseSchema,
                "List of missed payment audit events"
            ),
        },
    }),

    retryMissedPayment: createRoute({
        tags,
        method: HttpMethods.POST,
        path: "/internal/billing/retry-missed-payment",
        middleware: [requireInternalSecret] as const,
        request: {
            body: jsonContent(retryMissedPaymentRequestSchema, "Missed payment event to retry"),
        },
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                retryMissedPaymentResponseSchema,
                "Result of the retry attempt"
            ),
        },
    }),
};
