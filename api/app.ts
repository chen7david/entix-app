import { globalErrorHandler } from "./middleware/global-error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import authRoute from "./routes/auth.route";
import usersRoute from "./routes/users.route";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "./middleware/logger.middleware";
import { AppEnv } from "./app.type";

const app = new OpenAPIHono<AppEnv>();

app.use(logger());
// ---------------------------
// Routes
// ---------------------------

app.route("/api/v1/users", usersRoute);
app.route("/api/v1/auth", authRoute);

// ---------------------------
// Error & 404 handlers
// ---------------------------

app.notFound(notFoundHandler);
app.onError(globalErrorHandler);

export default app;