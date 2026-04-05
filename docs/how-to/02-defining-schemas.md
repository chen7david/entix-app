<!-- AI_CONTEXT -->
<!-- This document explains how to define Drizzle schemas and Zod DTOs. -->

# Defining Schemas

Data integrity is enforced at two levels: the database schema (Drizzle ORM) and the request/response payloads (Zod).

## 1. Drizzle DB Schema

Database tables are defined in `shared/db/schema/`.

### Table Rules
- **Plural naming**: Tables represent collections of rows (`users`, `organizations`, `playlists`).
- **Snake_case in DB**: Columns use `snake_case` in the database, mapped to `camelCase` in TypeScript.
- **Foreign Keys**: Always use the `{entity}_id` pattern (`organization_id`, `user_id`).
- **Timestamps**: Every table should include `created_at` and `updated_at`.

```typescript
// shared/db/schema/media.schema.ts
export const playlists = sqliteTable("playlists", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

### Type Inference
Drizzle can automatically generate types for insertion and selection.

```typescript
export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
```

## 2. Zod Validation (DTOs)

Request and response validation is handled in `shared/schemas/dto/`.

### Naming Convention
- **`{Action}{Domain}Input`**: For request bodies (`CreatePlaylistInput`, `UpdatePlaylistInput`).
- **`{Domain}Schema`**: For the base domain object representation.
- **`{Domain}ListResponseSchema`**: For paginated or multi-record lists.

```typescript
// shared/schemas/dto/playlist.dto.ts
export const playlistSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    title: z.string(),
});

export const createPlaylistSchema = playlistSchema.pick({
    title: true,
}).extend({
    coverArtUploadId: z.string().optional(),
});
```

## 3. Coercing `undefined` to `null`

Drizzle's `.findFirst()` returns `undefined` if no row is matches. Our **Repository pattern** strictly enforces returning `null` for non-existent records to ensure consistent API behavior.

```typescript
// ✅ Correct Repository implementation
async findById(id: string) {
    return await this.db.query.playlists.findFirst({
        where: eq(playlists.id, id),
    }) ?? null; // Coerce undefined to null
}
```

---
Last updated: 2026-03-30
