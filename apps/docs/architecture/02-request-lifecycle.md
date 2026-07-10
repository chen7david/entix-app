<!-- AI_CONTEXT -->
<!-- This document traces a single request through the architecture layers. -->

# Request Lifecycle

To understand how Entix-App works, let's trace a real request: `GET /api/v1/orgs/:organizationId/playlists`.

## 1. Route Definition (`playlist.routes.ts`)
The lifecycle begins with a typed route definition using `@hono/zod-openapi`. This defines the metadata, request parameters (validated via Zod), and expected responses.

```typescript
export const listPlaylists = createRoute({
    method: "get",
    path: "/orgs/{organizationId}/playlists",
    middleware: [requirePermission("playlist", ["read"])] as const,
    request: {
        params: z.object({
            organizationId: z.string(),
        }),
    },
    responses: {
        200: jsonContent(z.array(playlistSchema), "List of playlists"),
    },
});
```

## 2. Route Handler (`playlist.handlers.ts`)
The handler is responsible for extracting validated data, calling the appropriate service, and returning a response. It **never** contains business logic or direct database queries.

```typescript
static listPlaylists: AppHandler<typeof PlaylistRoutes.listPlaylists> = async (ctx) => {
    // 1. Extract validated parameters
    const { organizationId } = ctx.req.valid("param");

    // 2. Instantiate service via factory
    const playlistService = getPlaylistService(ctx);

    // 3. Delegate to service layer
    const playlists = await playlistService.listPlaylists(organizationId);

    // 4. Return typed JSON response
    return ctx.json(playlists, HttpStatusCodes.OK);
};
```

## 3. Domain Service (`playlist.service.ts`)
The service layer handles business logic, orchestration, and authorization results. It provides a clean API for handlers.

```typescript
export class PlaylistService extends BaseService {
    async listPlaylists(organizationId: string) {
        // Business logic or cross-repo orchestration happens here.
        // For a list, we often just call the repository.
        return await this.playlistRepo.findPlaylistsByOrganization(organizationId);
    }
}
```

## 4. Repository (`playlist.repository.ts`)
The repository is "dumb" and strictly handles database mechanics using Drizzle ORM. It returns raw data or `null`.

```typescript
export class PlaylistRepository {
    async findPlaylistsByOrganization(organizationId: string): Promise<schema.Playlist[]> {
        return await this.db.query.playlists.findMany({
            where: eq(playlists.organizationId, organizationId),
            orderBy: desc(playlists.createdAt),
        });
    }
}
```

## 5. D1 Database (SQLite)
The repository executes the SQL against Cloudflare D1. The resulting rows are mapped back to TypeScript objects by Drizzle and returned up the chain.

## 6. Response Validation
Finally, the Hono router ensures the response matches the `playlistSchema` defined in the route. If it doesn't, a runtime error is logged (in development) to catch schema mismatches.

---
Last updated: 2026-03-30
