import { getAdminAuditService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { AdminAuditRoutes } from "./audit.routes";

export const AdminAuditHandler = {
    list: (async (c) => {
        const filters = c.req.valid("query");
        const result = await getAdminAuditService(c).list(filters as any);
        return c.json(result, HttpStatusCodes.OK);
    }) as AppHandler<typeof AdminAuditRoutes.list>,

    acknowledge: (async (c) => {
        const { id } = c.req.valid("param");
        const userId = c.get("userId");
        await getAdminAuditService(c).acknowledge(id, userId);

        return c.json({ success: true }, HttpStatusCodes.OK);
    }) as AppHandler<typeof AdminAuditRoutes.acknowledge>,

    requeueFailedPayment: (async (c) => {
        const { eventId, organizationId } = c.req.valid("json");
        const userId = c.get("userId");

        await getAdminAuditService(c).requeueFailedPayment(eventId, organizationId, userId);

        return c.json({ status: "queued" as const }, HttpStatusCodes.OK);
    }) as AppHandler<typeof AdminAuditRoutes.requeueFailedPayment>,
};
