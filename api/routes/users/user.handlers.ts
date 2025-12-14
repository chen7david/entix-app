import { HttpStatusCodes } from "../../helpers/http.helpers";
import { AppHandler } from '../../helpers/types.helpers';
import { UserRoutes } from './user.routes';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (c) => {

        c.var.logger.info(`All users`);

        return c.json([
            {
                username: 'testUser',
                email: 'testUser@entix.com',
            },
        ], HttpStatusCodes.OK);
    }

    static create: AppHandler<typeof UserRoutes.create> = async (c) => {
        const { username, email } = c.req.valid('json')

        c.var.logger.info(`User ${username} created`);

        return c.json([
            {
                username,
                email,
            }
        ], HttpStatusCodes.OK);
    }
}