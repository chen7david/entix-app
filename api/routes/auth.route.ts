import { Hono } from 'hono';
import { loginSchema } from '@shared/index';
import { validator } from '../middleware/zod-validator';


const app = new Hono();

app.post('/login', validator('json', loginSchema), async (c) => {
    const { username } = c.req.valid('json');

    return c.json({
        message: `Logged in as ${username}`,
        token: "fake-jwt-token",
    });
});

export default app;
