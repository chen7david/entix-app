
import { OpenAPIHono } from "@hono/zod-openapi";
import { AppEnv, AppOpenApi } from "../app.type";
import { notFoundHandler } from "../middleware/not-found.middleware";
import { globalErrorHandler } from "../middleware/global-error.middleware";
import { logger } from "../middleware/logger.middleware";


export const createRouter = () => {
    const router = new OpenAPIHono<AppEnv>({ strict: false });
    return router;
}

export const mountRoutes = (app: AppOpenApi, routes: OpenAPIHono<AppEnv>[], prefix: string = '/api/v1') => {
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

