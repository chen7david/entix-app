import { getOrganizationService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { AdminOrgsRoutes } from "./orgs.routes";

export const AdminOrgsHandler = {
    list: (async (ctx) => {
        const { limit, cursor, direction, search } = ctx.req.valid("query");
        ctx.var.logger.info({ limit, cursor, direction, search }, "Fetching global organizations");

        const orgService = getOrganizationService(ctx);
        const { items, nextCursor, prevCursor } = await orgService.listOrganizationsPaginated(
            limit,
            cursor,
            direction,
            search
        );

        const mappedItems = items.map((org) => ({
            ...org,
            createdAt: org.createdAt.getTime(),
        }));

        return ctx.json(
            {
                items: mappedItems,
                nextCursor,
                prevCursor,
            },
            HttpStatusCodes.OK
        );
    }) as AppHandler<typeof AdminOrgsRoutes.list>,
};
