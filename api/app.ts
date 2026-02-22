import { createApp } from "./lib/app.lib";
import { configureOpenApi } from "./lib/open-api.lib";
import { mountRoutes } from "./lib/app.lib";
import { routes } from "./routes/index.route";
import { mountBetterAuth } from "./lib/auth/auth";
import { mountAuthMiddleware } from "./lib/auth-middleware.lib";


const app = createApp();

configureOpenApi(app);

mountAuthMiddleware(app);

mountRoutes({ app, routes, prefix: '/api/v1' });
mountBetterAuth(app);

export default app;