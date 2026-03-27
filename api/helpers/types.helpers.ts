import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { PinoLogger } from 'hono-pino';

export type AppEnv = {
    Bindings: CloudflareBindings;
    Variables: {
        logger: PinoLogger;
        frontendUrl: string;
        userId: string;
        isSuperAdmin: boolean;
        organizationId: string;
        membershipId: string;
        membershipRole: string;
    };
};

export type AppOpenApi = OpenAPIHono<AppEnv>

export type MountRoutes = {
    app: AppOpenApi;
    routes: OpenAPIHono<AppEnv>[];
    prefix: string;
}

export type AppHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>
export type AppContext = Context<AppEnv>