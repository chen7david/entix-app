<!-- AI_CONTEXT -->
<!-- This document explains how to define routes and handlers using @hono/zod-openapi. -->

# OpenAPI & Routing

Entix-App uses `@hono/zod-openapi` to automatically generate API documentation and ensure type-safe request/response handling.

## 1. Defining the Route

A route is defined by its method, path, and Zod schemas for parameters and responses.

```typescript
// api/routes/orgs/playlist.routes.ts
import { createRoute, z } from "@hono/zod-openapi";

export const getPlaylistRoute = createRoute({
    method: "get",
    path: "/orgs/{organizationId}/playlists/{playlistId}",
    middleware: [requirePermission("playlist", ["read"])] as const,
    request: {
        params: z.object({
            organizationId: z.string().openapi({ example: "org_123" }),
            playlistId: z.string().openapi({ example: "playlist_456" }),
        }),
    },
    responses: {
        200: jsonContent(playlistSchema, "The requested playlist"),
        404: jsonContent(z.object({ error: z.string() }), "Playlist not found"),
    },
});
```

## 2. Implementing the Handler

Handlers bind to these route definitions. Using `AppHandler<typeof Route>` at the type level ensures the handler correctly receives the validated request data.

```typescript
// api/routes/orgs/playlist.handlers.ts
import type { AppHandler } from "@api/helpers/types.helpers";
import type { PlaylistRoutes } from "./playlist.routes";

export class PlaylistHandlers {
    static getPlaylist: AppHandler<typeof PlaylistRoutes.getPlaylist> = async (ctx) => {
        // Validation is automatically enforced by Hono's middleware.
        const { organizationId, playlistId } = ctx.req.valid("param");

        const playlistService = getPlaylistService(ctx);
        const playlist = await playlistService.getPlaylist(playlistId, organizationId);

        return ctx.json(playlists, HttpStatusCodes.OK);
    };
}
```

## ⚠️ Common Mistakes (Avoid)

1. **Using `z.any()`**: Never use `z.any()` for schemas. It defeats the purpose of type safety and documentation.
2. **Missing 404 Responses**: If a handler calls a `get*` service method, the route **must** define a `404` response in its `responses` object.
3. **Leaking Logic into Handlers**: Handlers should only handle HTTP concerns. If you have an `if` statement checking business conditions, it belongs in a Service.
4. **Incorrect Route Naming**: Route constants should follow the `{action}{Domain}Route` pattern (e.g., `listPlaylistsRoute`), not just `{Domain}Route`.
5. **Direct Repository Access**: Never call a repository factory inside a handler. Always use a service.

## 3. `AppError` Mapping

When our **Service layer** throws an `AppError` (like `NotFoundError`), it is automatically caught and mapped to the correct HTTP status code and JSON response format by the global error handler middleware.

Common `AppError` subclasses:
- `NotFoundError`: Mapped to `404 Not Found`.
- `UnauthorizedError`: Mapped to `401 Unauthorized`.
- `ForbiddenError`: Mapped to `403 Forbidden`.
- `BadRequestError`: Mapped to `400 Bad Request`.

---
Last updated: 2026-03-30
