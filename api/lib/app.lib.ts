
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

export const createApp = () => {
    const app = new OpenAPIHono<AppEnv>({ strict: false });

    app.use(logger());

    app.notFound(notFoundHandler);
    app.onError(globalErrorHandler);

    return app;
}

