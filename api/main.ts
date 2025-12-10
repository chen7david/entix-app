import { Hono } from "hono";
import { userSchema } from "@shared/index";
import type { UserDTO } from "@shared/index";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/api/v1/users", (c) => {
  const user: UserDTO = userSchema.parse({
    id: "1",
    name: "Server User",
    email: "server.user@example.com",
  });

  return c.json(user);
});

export default app;
