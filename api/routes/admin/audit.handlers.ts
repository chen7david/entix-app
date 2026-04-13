import { getSystemAuditRepository } from "@api/factories/repository.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
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
};
