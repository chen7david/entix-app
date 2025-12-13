import authRoute from "./routes/auth.route";
import usersRoute from "./routes/users.route";
import { createApp } from "./lib/app.lib";
import { configureOpenApi } from "./lib/open-api.lib";

const app = createApp();

configureOpenApi(app);

app.route("/api/v1/users", usersRoute);
app.route("/api/v1/auth", authRoute);

export default app;