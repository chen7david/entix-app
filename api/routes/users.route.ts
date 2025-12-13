import { createRoute } from '@hono/zod-openapi';
import { createRouter } from '../lib/app.lib';
import { userSchema } from '@shared/index';
import type { UserDTO } from '@shared/index';

const router = createRouter().openapi(createRoute({
    method: 'get',
    path: '/',
    tags: ['Users'],
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: userSchema.array(),
                },
            },
        },
    },
}), (c) => {
    const user: UserDTO = userSchema.parse({
        id: "1",
        name: "Server User",
        email: "server.user@example.com",
    });

    return c.json([user]);
});

export default router;
