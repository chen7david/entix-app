import { Hono } from "hono";
import { SHARED_GREETING, userSchema } from "@shared/index";
import type { UserDTO } from "@shared/index";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
  return c.text(SHARED_GREETING);
});

app.get("/user", (c) => {
  const user: UserDTO = userSchema.parse({
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
  });

  return c.json(user);
});

export default app;
