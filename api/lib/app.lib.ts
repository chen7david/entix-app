
import { OpenAPIHono } from "@hono/zod-openapi";
import { AppEnv } from "../app.type";
import { notFoundHandler } from "../middleware/not-found.middleware";
import { globalErrorHandler } from "../middleware/global-error.middleware";
import { logger } from "../middleware/logger.middleware";



export const createApp = () => {
    const app = new OpenAPIHono<AppEnv>({ strict: false });

    app.use(logger());

    app.notFound(notFoundHandler);
    app.onError(globalErrorHandler);

    return app;
}

