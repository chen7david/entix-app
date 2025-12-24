import { createApp } from "./lib/app.lib";
import { configureOpenApi } from "./lib/open-api.lib";
import { mountRoutes } from "./lib/app.lib";
import { routes } from "./routes/index.route";
import { mountBetterAuth } from "./lib/better-auth";

const app = createApp();

configureOpenApi(app);
mountBetterAuth(app);
mountRoutes({ app, routes, prefix: '/api/v1' });

export default app;