import { getCorsOrigins } from "@api/helpers/cors.helpers";
import type { AppEnv, MountRoutes } from "@api/helpers/types.helpers";
import { envValidatorMiddleware } from "@api/middleware/env-validator.middleware";
import { frontendUrlMiddleware } from "@api/middleware/frontend-url.middleware";
import { globalErrorHandler } from "@api/middleware/global-error.middleware";
import { logger } from "@api/middleware/logger.middleware";
import { notFoundHandler } from "@api/middleware/not-found.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

export const createRouter = () => {
    const router = new OpenAPIHono<AppEnv>({
        strict: false,
        defaultHook: (result) => {
            if (!result.success) {
                throw result.error;
            }
        },
    });
    return router;
};

export const mountRoutes = ({ app, routes, prefix }: MountRoutes) => {
    routes.forEach((route) => {
        app.route(prefix, route);
    });
};

export const createApp = () => {
    const app = new OpenAPIHono<AppEnv>({ strict: false });

    app.use("*", frontendUrlMiddleware());

    app.use(
        "*",
        cors({
            origin: (origin, ctx) => {
                const allowedOrigins = getCorsOrigins(ctx);
                return allowedOrigins.includes(origin) ? origin : null;
            },
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
            exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
            maxAge: 600,
            credentials: true,
        })
    );

    app.use(logger());
    app.use("*", envValidatorMiddleware());

    app.notFound(notFoundHandler);
    app.onError(globalErrorHandler);

    return app;
};
