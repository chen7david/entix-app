import { AppContext } from "./types.helpers";

/**
 * Automatically determines the frontend URL based on the environment.
 * Works for Localhost, Cloudflare Previews (*.workers.dev), and Production.
 */
export const getFrontendUrl = (ctx: AppContext): string => {
    const url = new URL(ctx.req.url);

    // 1. Handle Local Development
    // If you are running 'wrangler dev', it usually defaults to localhost:8787
    // We point this to your Vite dev server (usually 5173 or 8000 depending on your setup)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        // Check if the FRONTEND_URL env var explicitly contains localhost 
        // to use the correct port (e.g. 8000 vs 5173).
        if (ctx.env.FRONTEND_URL && ctx.env.FRONTEND_URL.includes("localhost")) {
            return ctx.env.FRONTEND_URL;
        }
        return "http://localhost:8000";
    }

    // 2. Handle Cloudflare Preview URLs
    // This matches your *-entix-app.chen7david.workers.dev pattern
    if (url.hostname.endsWith(".workers.dev")) {
        return url.origin;
    }

    // 3. Production Fallback
    // Falls back to the FRONTEND_URL defined in your Cloudflare Bindings
    return ctx.env.FRONTEND_URL;
};
