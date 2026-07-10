import { createRouter } from "@api/lib/app.lib";
import { AdminAuditHandler } from "./audit.handlers";
import { AdminAuditRoutes } from "./audit.routes";

export const adminAuditRoutes = createRouter()
    .openapi(AdminAuditRoutes.list, AdminAuditHandler.list)
    .openapi(AdminAuditRoutes.acknowledge, AdminAuditHandler.acknowledge)
    .openapi(AdminAuditRoutes.requeueFailedPayment, AdminAuditHandler.requeueFailedPayment);
