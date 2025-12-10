import { Hono } from "hono";
import { userSchema } from "@shared/index";
import type { UserDTO } from "@shared/index";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/user", (c) => {
  const user: UserDTO = userSchema.parse({
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
  });

  return c.json(user);
});

export default app;
