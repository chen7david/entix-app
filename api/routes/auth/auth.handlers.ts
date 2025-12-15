import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { AuthRoutes } from './auth.routes';

export class AuthHandler {
    static signIn: AppHandler<typeof AuthRoutes.signIn> = async (c) => {

        c.var.logger.info(`User signed in`);

        return c.json(
            {
                user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    xid: "123e4567-e89b-12d3-a456-426614174000",
                    username: 'testUser',
                    email: 'testUser@entix.org',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                token: 'token',
                refreshToken: 'refreshToken',
            },
            HttpStatusCodes.OK);
    }

    static signUp: AppHandler<typeof AuthRoutes.signUp> = async (c) => {
        const { username } = c.req.valid('json')

        c.var.logger.info(`User ${username} created`);

        return c.json(
            {
                id: "123e4567-e89b-12d3-a456-426614174000",
                xid: "123e4567-e89b-12d3-a456-426614174000",
                username,
                email: "testUser@entix.org",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            , HttpStatusCodes.OK);
    }
}