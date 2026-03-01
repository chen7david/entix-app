import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { UserRepository } from '@api/repositories/user.repository';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (ctx) => {
        const organizationId = ctx.get('organizationId')!;

        ctx.var.logger.info({ organizationId }, `Fetching users for organization`);

        const userRepo = new UserRepository(ctx);
        const users = await userRepo.findUsersByOrganization(organizationId);

        ctx.var.logger.info({ count: users.length, organizationId }, "Users fetched for organization");

        return ctx.json(users, HttpStatusCodes.OK);
    }
}
