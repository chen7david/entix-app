
import { OpenAPIHono } from "@hono/zod-openapi";
import { AppEnv, MountRoutes } from "@api/helpers/types.helpers";
import { notFoundHandler } from "@api/middleware/not-found.middleware";
import { globalErrorHandler } from "@api/middleware/global-error.middleware";
import { logger } from "@api/middleware/logger.middleware"

export const createRouter = () => {
    const router = new OpenAPIHono<AppEnv>({
        strict: false, defaultHook: (result) => {
            if (!result.success) {
                throw result.error;
            }
        },
    });
    return router;
}

export const mountRoutes = ({ app, routes, prefix }: MountRoutes) => {
    routes.forEach((route) => {
        app.route(prefix, route);
    });
}

import { cors } from 'hono/cors';

export const createApp = () => {
    const app = new OpenAPIHono<AppEnv>({ strict: false });

    app.use('*', cors({
        origin: (origin, c) => {
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:8000', // Vite default
                c.env.FRONTEND_URL,
                'https://entix.org',
                'https://staging.entix.org'
            ];
            return allowedOrigins.includes(origin) ? origin : null;
        },
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
        maxAge: 600,
        credentials: true,
    }));

    app.use(logger());

    app.notFound(notFoundHandler);
    app.onError(globalErrorHandler);

    return app;
}

