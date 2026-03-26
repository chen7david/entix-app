import type { AppContext } from "./types.helpers";

/**
 * Automatically determines the frontend URL based on the environment.
 * Works for Localhost, Cloudflare Previews (*.workers.dev), and Production.
 */
export const getFrontendUrl = (ctx: AppContext): string => {
    const url = new URL(ctx.req.url);

    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        if (ctx.env.FRONTEND_URL && ctx.env.FRONTEND_URL.includes("localhost")) {
            return ctx.env.FRONTEND_URL;
        }
        return "http://localhost:8000";
    }

    if (url.hostname.endsWith(".workers.dev")) {
        return url.origin;
    }

    return ctx.env.FRONTEND_URL;
};
