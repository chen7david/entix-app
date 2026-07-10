import { getReconciliationService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { ReconciliationRoutes } from "./reconciliation.routes";

export const ReconciliationHandler = {
    listMissedPayments: (async (c) => {
        const query = c.req.valid("query") as any;
        const {
            organizationId,
            severity,
            eventType,
            actorId,
            unresolvedOnly,
            limit,
            cursor,
            direction,
        } = query;

        const result = await getReconciliationService(c).listMissedPayments({
            organizationId,
            severity,
            eventType: eventType || "payment.missed",
            actorId,
            unresolvedOnly: unresolvedOnly ?? true,
            limit,
            cursor,
            direction,
        });

        return c.json(result, HttpStatusCodes.OK);
    }) as AppHandler<typeof ReconciliationRoutes.listMissedPayments>,

    retryMissedPayment: (async (c) => {
        const { eventId, organizationId } = c.req.valid("json");
        const result = await getReconciliationService(c).retryMissedPayment(
            eventId,
            organizationId
        );

        switch (result.outcome) {
            case "not_found":
                return c.json(
                    {
                        success: false,
                        status: "failed",
                        message: "Event not found or not a missed payment",
                    },
                    HttpStatusCodes.NOT_FOUND
                );
            case "already_acknowledged":
                return c.json(
                    {
                        success: true,
                        status: "acknowledged",
                        message: "Payment already processed or acknowledged",
                    },
                    HttpStatusCodes.OK
                );
            case "invalid_metadata":
            case "accounts_unresolved":
                return c.json(
                    {
                        success: false,
                        status: "failed",
                        message:
                            result.outcome === "invalid_metadata"
                                ? "Invalid event metadata"
                                : "Could not resolve source or destination accounts",
                    },
                    HttpStatusCodes.UNPROCESSABLE_ENTITY
                );
            case "success":
                return c.json(
                    {
                        success: true,
                        status: "retried",
                        message: "Payment successfully processed",
                    },
                    HttpStatusCodes.OK
                );
            case "processing_failed":
                return c.json(
                    {
                        success: false,
                        status: "failed",
                        message: result.message,
                    },
                    HttpStatusCodes.OK
                );
            default: {
                const _exhaustive: never = result;
                return _exhaustive;
            }
        }
    }) as AppHandler<typeof ReconciliationRoutes.retryMissedPayment>,
};
