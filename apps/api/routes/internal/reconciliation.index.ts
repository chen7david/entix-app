import { createRouter } from "@api/lib/app.lib";
import { ReconciliationHandler } from "./reconciliation.handlers";
import { ReconciliationRoutes } from "./reconciliation.routes";

export const internalReconciliationRoutes = createRouter()
    .openapi(ReconciliationRoutes.listMissedPayments, ReconciliationHandler.listMissedPayments)
    .openapi(ReconciliationRoutes.retryMissedPayment, ReconciliationHandler.retryMissedPayment);
