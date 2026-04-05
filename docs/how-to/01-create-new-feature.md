<!-- AI_CONTEXT -->
<!-- This is a step-by-step guide for creating a new feature in the API. -->

# Create a New Feature

Adding a new feature follows a consistent path from the database to the route handler. Let's walk through adding a new "Playlist" feature.

## Step 1: Define the DB Schema
Add your table to a schema file in `shared/db/schema/`.

```typescript
// shared/db/schema/media.schema.ts
export const playlists = sqliteTable("playlists", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    title: text("title").notNull(),
    // ...
});
```

Define the DTO schemas for request/response validation in `shared/schemas/dto/`.

```typescript
// shared/schemas/dto/playlist.dto.ts
export const playlistSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
});
```

## Step 2: Create the Repository
Create a "dumb" repository for data access.

```typescript
// api/repositories/playlist.repository.ts
export class PlaylistRepository {
    constructor(private db: AppDb) {}

    async findPlaylistById(id: string, organizationId: string): Promise<schema.Playlist | null> {
        return await this.db.query.playlists.findFirst({
            where: and(eq(playlists.id, id), eq(playlists.organizationId, organizationId)),
        }) ?? null;
    }
}
```

## Step 3: Create the Service
Implement business logic and the `find*` vs `get*` protocol.

```typescript
// api/services/playlist.service.ts
export class PlaylistService extends BaseService {
    constructor(private playlistRepo: PlaylistRepository) {
        super();
    }

    async findPlaylist(id: string, orgId: string) {
        return await this.playlistRepo.findPlaylistById(id, orgId);
    }

    async getPlaylist(id: string, orgId: string) {
        const playlist = await this.findPlaylist(id, orgId);
        return this.assertExists(playlist, "Playlist not found");
    }
}
```

## Step 4: Add to Factories
Register your new repository and service in `api/factories/`.

```typescript
// api/factories/service.factory.ts
export const getPlaylistService = (ctx: Context) => {
    const db = getDbClient(ctx);
    const repo = new PlaylistRepository(db);
    return new PlaylistService(repo);
};
```

## Step 5: Define the Route & Handler
Declare the OpenAPI route and the route handler.

```typescript
// api/routes/orgs/playlist.routes.ts
export const getPlaylistRoute = createRoute({
    method: "get",
    path: "/orgs/{organizationId}/playlists/{playlistId}",
    // ... metadata, request/responses
});

// api/routes/orgs/playlist.handlers.ts
export class PlaylistHandlers {
    static getPlaylist: AppHandler<typeof PlaylistRoutes.getPlaylist> = async (ctx) => {
        const { organizationId, playlistId } = ctx.req.valid("param");
        const service = getPlaylistService(ctx);
        const playlist = await service.getPlaylist(playlistId, organizationId);
        return ctx.json(playlist, HttpStatusCodes.OK);
    };
};
```

## Step 6: Create Unit Tests
Test your features starting with the Service layer (mocking the repo).

```typescript
// tests/unit/playlist.service.test.ts
describe("PlaylistService", () => {
    it("should throw NotFoundError if playlist does not exist", async () => {
        const mockRepo = { findPlaylistById: vi.fn().mockResolvedValue(null) };
        const service = new PlaylistService(mockRepo as any);
        await expect(service.getPlaylist("123", "org1")).rejects.toThrow(NotFoundError);
    });
});
```

---
Last updated: 2026-03-30
