import { createApp, mountRoutes } from "./lib/app.lib";
import { mountBetterAuth } from "./lib/auth/auth";
import { mountAuthMiddleware } from "./lib/auth-middleware.lib";
import { configureOpenApi } from "./lib/open-api.lib";
import { routes } from "./routes/index.route";

const app = createApp();

configureOpenApi(app);

mountAuthMiddleware(app);

mountRoutes({ app, routes, prefix: "/api/v1" });
mountBetterAuth(app);

configureOpenApi(app);

export default app;
