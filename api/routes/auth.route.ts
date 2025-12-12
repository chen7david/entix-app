import { Hono } from 'hono';
import { loginSchema } from '@shared/index';
import { validator } from '../middleware/zod-validator';
import { AuthController } from '../controllers/auth.controller';
import { OpenAPIHono } from '@hono/zod-openapi';
import { AppEnv } from '../app.type';

const app = new OpenAPIHono<AppEnv>();

app.post('/logins', validator('json', loginSchema), AuthController.login);

app.post('/login', validator('json', loginSchema), async (c) => {
    const { username } = c.req.valid('json');

    c.var.logger.info(`User ${username} logged in`);

    return c.json({
        message: `Logged in as ${username}`,
        token: "fake-jwt-token",
    });
});

export default app;
