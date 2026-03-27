import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { getUserService } from '@api/factories/service.factory';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (ctx) => {
        const organizationId = ctx.get('organizationId')!;
        const { limit, cursor, direction, search } = ctx.req.valid('query');

        ctx.var.logger.info({ organizationId }, `Fetching users for organization`);

        const userService = getUserService(ctx);
        const paginatedResult = await userService.findUsersByOrganization(organizationId, limit, cursor, direction, search);

        ctx.var.logger.info({ count: paginatedResult.items.length, organizationId }, "Users fetched for organization");

        return ctx.json(paginatedResult, HttpStatusCodes.OK);
    }
}
