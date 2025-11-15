import { Hono } from "hono";
import { validate } from "./middleware/validation.middleware";
import { createUserDto } from "@shared/dtos/user.dto";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/api/v1/message", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/v1/users", validate("json", createUserDto), async (c) => {
  const { username, password, email } = await c.req.valid("json");
  return c.json({ username, password, email });
});

export default app;
