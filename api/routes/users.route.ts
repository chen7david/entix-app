import { Hono } from 'hono';
import { userSchema } from '@shared/index';
import type { UserDTO } from '@shared/index';

const app = new Hono();

app.get('/', (c) => {
    const user: UserDTO = userSchema.parse({
        id: "1",
        name: "Server User",
        email: "server.user@example.com",
    });

    return c.json(user);
});

export default app;
