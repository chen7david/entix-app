import type { AppEnv } from "@api/helpers/types.helpers";
import { getFrontendUrl } from "@api/helpers/url.helpers";
import { createMiddleware } from "hono/factory";

export const frontendUrlMiddleware = () => {
    return createMiddleware<AppEnv>(async (ctx, next) => {
        const url = getFrontendUrl(ctx);
        ctx.set("frontendUrl", url);
        await next();
    });
};
