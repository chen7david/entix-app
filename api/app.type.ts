import { OpenAPIHono } from "@hono/zod-openapi";
import type { Logger } from "pino";

export type AppEnv = {
    Bindings: CloudflareBindings;
    Variables: {
        logger: Logger;
    };
}

export type AppOpenApi = OpenAPIHono<AppEnv>

export type MountRoutesType = {
    app: AppOpenApi;
    routes: OpenAPIHono<AppEnv>[];
    prefix: string;
}