import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { PinoLogger } from 'hono-pino';

export type AppEnv = {
    Bindings: CloudflareBindings;
    Variables: {
        logger: PinoLogger;
        userId?: string;  // Set by requireAuth middleware
        isSuperAdmin?: boolean;  // Set by requireAuth middleware (platform-level admin, NOT org-level)
        organizationId?: string;  // Set by requireOrgMembership middleware
        membershipId?: string;  // Set by requireOrgMembership middleware
        membershipRole?: string;  // Set by requireOrgMembership middleware
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