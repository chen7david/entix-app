import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/api/v1/message", (c) => {
  return c.text("Hello Honos!");
});

export default app;
