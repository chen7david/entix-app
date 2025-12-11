import { Hono } from "hono";
import { loginSchema, userSchema } from "@shared/index";
import type { UserDTO } from "@shared/index";
import { globalErrorHandler } from "./middleware/global-error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { BadRequestError, UnprocessableEntityError } from "./errors/app.error";
import z from "zod";


const app = new Hono<{ Bindings: CloudflareBindings }>();


// ---------------------------
// Routes
// ---------------------------

app.get("/api/v1/users", (c) => {
  const user: UserDTO = userSchema.parse({
    id: "1",
    name: "Server User",
    email: "server.user@example.com",
  });

  return c.json(user);
});

app.post("/api/v1/auth/login", async (c) => {
  const body = await c.req.json().catch(() => {
    throw new BadRequestError("Invalid JSON body");
  });

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new UnprocessableEntityError(
      "Validation failed",
      z.treeifyError(parsed.error).properties,
    );
  }

  const { username } = parsed.data;

  return c.json({
    message: `Logged in as ${username}`,
    token: "fake-jwt-token",
  });
});

// ---------------------------
// Error & 404 handlers
// ---------------------------

app.notFound(notFoundHandler);
app.onError(globalErrorHandler);

export default app;
