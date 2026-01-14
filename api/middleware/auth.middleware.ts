import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth/better-auth.lib";
import { Permission } from "../../shared/types/auth-types";
import { HTTPException } from "hono/http-exception";
import { AppEnv } from "../helpers/types.helpers";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    const session = await auth(c).api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        throw new HTTPException(401, { message: "Unauthorized" });
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
});

export const requireOrganization = createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get("session") as any;
    if (!session?.activeOrganizationId) {
        throw new HTTPException(403, { message: "Organization context required" });
    }
    await next();
});

export const requirePermission = (permission: Permission) => createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get("session");
    const user = c.get("user");

    if (!session || !user) {
        throw new HTTPException(401, { message: "Unauthorized" });
    }

    // Parse permission string "resource:action"
    const [resource, action] = permission.split(":");

    // Use hasPermission from Better Auth
    // Note: We need to cast the permission object to match Better Auth's expected type if strict typing fails
    const api = auth(c).api as any;
    const hasPermission = await api.hasPermission({
        headers: c.req.raw.headers,
        body: {
            permission: {
                [resource]: [action]
            }
        }
    });

    if (!hasPermission) {
        throw new HTTPException(403, { message: "Forbidden" });
    }

    await next();
});
