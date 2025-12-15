import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { UserRoutes } from './user.routes';

export class UserHandler {
    static findAll: AppHandler<typeof UserRoutes.findAll> = async (c) => {

        c.var.logger.info(`All users`);

        return c.json([
            {
                id: "123e4567-e89b-12d3-a456-426614174000",
                xid: "123e4567-e89b-12d3-a456-426614174000",
                username: 'testUser',
                email: 'testUser@entix.org',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ], HttpStatusCodes.OK);
    }

    static create: AppHandler<typeof UserRoutes.create> = async (c) => {
        const { username, email } = c.req.valid('json')

        c.var.logger.info(`User ${username} created`);

        return c.json([
            {
                id: "123e4567-e89b-12d3-a456-426614174000",
                xid: "123e4567-e89b-12d3-a456-426614174000",
                username,
                email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ], HttpStatusCodes.OK);
    }
}