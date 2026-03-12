import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { getUserService } from '@api/factories/service.factory';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (ctx) => {
        const organizationId = ctx.get('organizationId')!;

        ctx.var.logger.info({ organizationId }, `Fetching users for organization`);

        const userService = getUserService(ctx);
        const users = await userService.findUsersByOrganization(organizationId);

        ctx.var.logger.info({ count: users.length, organizationId }, "Users fetched for organization");

        return ctx.json(users, HttpStatusCodes.OK);
    }
}
