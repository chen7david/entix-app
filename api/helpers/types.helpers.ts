import { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import { Context } from "hono";
import type { Logger } from "pino";
import type { Session, User } from "better-auth";

export type AppEnv = {
    Bindings: CloudflareBindings;
    Variables: {
        logger: Logger;
        user: User | null;
        session: Session | null;
    };
}

export type AppOpenApi = OpenAPIHono<AppEnv>

export type MountRoutes = {
    app: AppOpenApi;
    routes: OpenAPIHono<AppEnv>[];
    prefix: string;
}

export type AppHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>
export type AppContext = Context<AppEnv>