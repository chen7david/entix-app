import { getDbClient } from "@api/factories/db.factory";
import { getSystemAuditRepository } from "@api/factories/repository.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { EntixQueueMessage } from "@api/queues/entix.queue";
import { systemAuditEvents } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";
import type { AdminAuditRoutes } from "./audit.routes";

export const AdminAuditHandler = {
    list: (async (c) => {
        const auditRepo = getSystemAuditRepository(c);
        const filters = c.req.valid("query");

        const result = await auditRepo.list(filters as any);
        return c.json(result, HttpStatusCodes.OK);
    }) as AppHandler<typeof AdminAuditRoutes.list>,

    acknowledge: (async (c) => {
        const { id } = c.req.valid("param");
        const userId = c.get("userId");
        const auditRepo = getSystemAuditRepository(c);
        await auditRepo.acknowledge(id, userId || "system", new Date());

        return c.json({ success: true }, HttpStatusCodes.OK);
    }) as AppHandler<typeof AdminAuditRoutes.acknowledge>,

    requeueFailedPayment: (async (c) => {
        const { eventId, organizationId } = c.req.valid("json");
        const db = getDbClient(c);
        const userId = c.get("userId");

        const msg: EntixQueueMessage = {
            type: "billing.retry-missed-payment",
            eventId,
            organizationId,
        };

        // Note: Using QUEUE binding here instead of ENTIX_QUEUE
        await c.env.QUEUE.send(msg);

        // Mark the reconciliation-failed audit event as acknowledged so the UI reflects the requeue
        await db
            .update(systemAuditEvents)
            .set({ acknowledgedAt: new Date(), acknowledgedBy: userId || "system" })
            .where(
                and(
                    eq(systemAuditEvents.id, eventId),
                    eq(systemAuditEvents.organizationId, organizationId)
                )
            );

        return c.json({ status: "queued" as const }, HttpStatusCodes.OK);
    }) as AppHandler<typeof AdminAuditRoutes.requeueFailedPayment>,
};
