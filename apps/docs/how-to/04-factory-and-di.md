<!-- AI_CONTEXT -->
<!-- This document explains how to use factories for dependency injection. -->

# Factories & Dependency Injection

Entix-App uses a factory pattern to manage the instantiation of repositories and services. This ensures a clean, testable dependency graph and allows for standardized injection of the D1 database client and external APIs.

## 1. What is a Factory?

A factory is a function that takes the **Hono Context (`ctx`)** and returns a fully initialized instance of a class. This is our primary mechanism for **Dependency Injection (DI)**.

## 2. Factory Rules

1.  **Context-bound**: All factories must take `ctx` as their first argument to access request-scoped bindings (`db`, `env`, `userId`).
2.  **Strict Isolation**:
    *   **Repository Factories**: Only receive the `db` client from `getDbClient(ctx)`. They never touch the Context directly.
    *   **Service Factories**: Receive their required repositories and any external clients (like `BetterAuth` or `Stripe`). They orchestrate multiple dependencies.
3.  **No Direct Repository Access (DRA)**: Handlers must **strictly** only use Service factories. Never call a Repository factory or class inside a route handler.

## 3. Implementation Example

### Service Factory

```typescript
// api/factories/service.factory.ts
import { getPlaylistRepository } from "./repository.factory";
import { PlaylistService } from "@api/services/playlist.service";

export const getPlaylistService = (ctx: Context) => {
    // 1. Get database client
    const db = getDbClient(ctx);

    // 2. Instantiate repository (often via repository factory)
    const playlistRepo = getPlaylistRepository(db);

    // 3. Return initialized service
    return new PlaylistService(playlistRepo);
};
```

### Repository Factory

```typescript
// api/factories/repository.factory.ts
import { PlaylistRepository } from "@api/repositories/playlist.repository";

export const getPlaylistRepository = (db: AppDb) => {
    return new PlaylistRepository(db);
};
```

## 4. Usage in Handlers

Handlers should be clean and declarative, delegating all instantiation to the factory.

```typescript
static listPlaylists: AppHandler<typeof PlaylistRoutes.listPlaylists> = async (ctx) => {
    const playlistService = getPlaylistService(ctx); // ✅ Single call for all dependencies
    const playlists = await playlistService.listPlaylists(ctx.req.valid("param").organizationId);
    return ctx.json(playlists, HttpStatusCodes.OK);
};
```

---
Last updated: 2026-03-30
