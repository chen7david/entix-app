import type { Hono } from "hono";
import type { AppEnv } from "@api/helpers/types.helpers";

/**
 * Core request function type used by all entity clients.
 * Returns the raw Response — no assertions, no JSON parsing.
 */
export type Requester = (
    path: string,
    options?: {
        method?: string;
        body?: unknown;
        cookie?: string;      // Override per-request cookie
    }
) => Promise<Response>;

/**
 * Create a base requester bound to app + env + optional default cookie.
 * All entity clients receive this to make HTTP calls.
 */
export function createRequester(
    app: Hono<AppEnv>,
    env: any,
    defaultCookie?: string
): Requester {
    return async (path, options = {}) => {
        const { method = "GET", body, cookie } = options;
        const activeCookie = cookie ?? defaultCookie;

        const headers: Record<string, string> = {};

        if (activeCookie) {
            headers["Cookie"] = activeCookie;
        }

        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
        }

        return app.request(
            path,
            {
                method,
                headers,
                ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
            },
            env
        );
    };
}
