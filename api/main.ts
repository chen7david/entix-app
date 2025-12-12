import { Hono } from "hono";
import { globalErrorHandler } from "./middleware/global-error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import authRoute from "./routes/auth.route";
import usersRoute from "./routes/users.route";

const app = new Hono<{ Bindings: CloudflareBindings }>();

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
