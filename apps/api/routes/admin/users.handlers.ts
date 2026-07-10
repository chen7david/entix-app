import { getUserService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { AdminUsersRoutes } from "./users.routes";

export const AdminUsersHandler = {
    list: (async (ctx) => {
        const { limit, cursor, direction, search } = ctx.req.valid("query");
        ctx.var.logger.info({ limit, cursor, direction, search }, "Fetching platform users");

        const userService = getUserService(ctx);
        const { items, nextCursor, prevCursor } = await userService.listUsersAdminPaginated(
            limit,
            cursor,
            direction,
            search
        );

        const mappedItems = items.map((user) => ({
            ...user,
            createdAt: user.createdAt.getTime(),
            updatedAt: user.updatedAt.getTime(),
            emailVerified: !!user.emailVerified,
        }));

        return ctx.json(
            {
                items: mappedItems,
                nextCursor,
                prevCursor,
            },
            HttpStatusCodes.OK
        );
    }) as AppHandler<typeof AdminUsersRoutes.list>,
};
