import { AppContext } from "./types.helpers";
import { getFrontendUrl } from "./url.helpers";

/**
 * Automatically parses and validates allowed CORS origins based on the environment.
 * Includes the active Frontend URL natively, plus any additional comma-separated origins defined in CORS_ORIGINS.
 */
export const getCorsOrigins = (ctx: AppContext): string[] => {
    const frontendUrl = getFrontendUrl(ctx);

    const configuredOrigins = (ctx.env.CORS_ORIGINS || '')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean);

    return [
        frontendUrl,
        ...configuredOrigins
    ];
};
