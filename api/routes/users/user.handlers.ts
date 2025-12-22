import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';
import { getDbClient } from '@api/factories/db.factory';
import { usersTable } from '@api/db/schema.db';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (c) => {

        c.var.logger.info(`All users`);

        const db = getDbClient(c);

        const users = await db.select().from(usersTable);

        c.var.logger.info({ users }, "DB connection check");

        return c.json(users, HttpStatusCodes.OK);
    }

    static create: AppHandler<typeof UserRoutes.create> = async (c) => {
        const userData = c.req.valid('json')

        c.var.logger.info(`User ${userData.username} created`);

        return c.json(userData, HttpStatusCodes.OK);
    }
}