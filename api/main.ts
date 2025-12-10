import { Hono } from "hono";
import { userSchema } from "@shared/index";
import type { UserDTO } from "@shared/index";
import { globalErrorHandler } from "./middleware/global-error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/api/v1/users", (c) => {
  const user: UserDTO = userSchema.parse({
    id: "1",
    name: "Server User",
    email: "server.user@example.com",
  });

  return c.json(user);
});

app.notFound(notFoundHandler);
app.onError(globalErrorHandler);

export default app;
