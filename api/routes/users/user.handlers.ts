import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { UserRepository } from '@api/repositories/user.repository';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (c) => {
        const organizationId = c.req.valid('param').organizationId;

        c.var.logger.info({ organizationId }, `Fetching users for organization`);

        const userRepo = new UserRepository(c);
        const users = await userRepo.findUsersByOrganization(organizationId);

        c.var.logger.info({ count: users.length, organizationId }, "Users fetched for organization");

        return c.json(users, HttpStatusCodes.OK);
    }

    static create: AppHandler<typeof UserRoutes.create> = async (c) => {
        const userData = c.req.valid('json')

        c.var.logger.info(`User ${userData.name} created`);

        return c.json(userData, HttpStatusCodes.CREATED);
    }
}