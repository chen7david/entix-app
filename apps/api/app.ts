import { createApp, mountRoutes } from "./lib/app.lib";
import { mountBetterAuth } from "./lib/auth/auth";
import { mountAuthMiddleware } from "./lib/auth-middleware.lib";
import { configureOpenApi } from "./lib/open-api.lib";
import { getRoutes } from "./routes/index.route";

const app = createApp();

configureOpenApi(app);

mountAuthMiddleware(app);

mountRoutes({ app, routes: getRoutes(), prefix: "/api/v1" });
mountBetterAuth(app);

configureOpenApi(app);

export type AppType = typeof app;
export default app;
