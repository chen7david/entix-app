<!-- AI_CONTEXT -->
<!-- This is the definitive naming convention guide for the project. -->

# Naming Conventions

Consistency in naming ensures the codebase is searchable, predictable, and maintainable. This guide defines the standards for every layer of the application.

## 1. Database Layer (SQL & Drizzle)

### Tables
- **Naming Rule**: Plural, `snake_case`.
- **Why**: Tables represent collections of entities.
- **Junction Tables**: `{table_a}_{table_b}` (plural both sides).
- **Prefixes**: Use `auth_` only for Better Auth managed tables.

| ✅ Correct | ❌ Incorrect |
| :--- | :--- |
| `users` | `user`, `tblUser`, `Users` |
| `organizations` | `organization`, `org`, `Organisation` |
| `auth_members` | `member`, `authMember`, `Members` |
| `playlist_tracks` | `playlistTrack`, `playlist_track` |

### Columns
- **Naming Rule**: `snake_case` in DB, `camelCase` in TS.
- **Primary Keys**: Always `id`.
- **Foreign Keys**: `{referenced_table_singular}_id`.
- **Booleans**: Prefix with `is_` or `has_`.
- **Timestamps**: `created_at`, `updated_at`.

```typescript
// shared/db/schema/media.schema.ts
export const playlists = sqliteTable("playlists", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(), // FK: snake_case in DB, camelCase in TS
    isPublic: integer("is_public", { mode: "boolean" }).default(false),
});
```

## 2. Repository Layer

Repositories handle raw data operations. They think in terms of rows and tables.

- **Class Name**: `{Domain}Repository` (e.g., `UserRepository`).
- **Method Prefix**: Always `find*` for reads, `insert*`, `update*`, `delete*`.
- **Return Type**: `find*` returns `T | null` (never throws).

| Operation | Repository Method Naming |
| :--- | :--- |
| Read one | `findUserById`, `findUserByEmail` |
| Read many | `findUsersByOrganization`, `findMembersByRole` |
| Existence | `existsMemberByUserId` |

## 3. Service Layer

Services handle business actions. They think in terms of domain concepts and workflows.

- **Class Name**: `{Domain}Service` (e.g., `PlaylistService`).
- **Read Methods**: Standard `find*` (nullable) vs `get*` (throwing) protocol.
- **Action Methods**: Business verbs (`addMember`, `transferOwnership`, `inviteUser`).

| Database Action | Repository Name | Service Action Name |
| :--- | :--- | :--- |
| Insert a member | `insertMember` | `addMember` / `inviteUser` |
| Delete a member | `deleteMember` | `removeMember` / `kickUser` |
| Update a role | `updateMember` | `changeRole` / `promoteUser` |

### **The find* vs get* Distinction**

| Feature | `find*` (Nullable) | `get*` (Required) |
| :--- | :--- | :--- |
| **Return Type** | `T | null` | `T` (never null) |
| **Behavior** | Safe; returns null if missing | Throws `NotFoundError` if missing |
| **Usage** | Repositories & Services | Services ONLY |
| **Intent** | Optional lookup | Mandatory existence |

## 4. API Layer (Handlers & Routes)

- **Route Constant**: `{action}{Domain}Route` (e.g., `createPlaylistRoute`).
- **Handler Class**: `{Domain}Handlers` (e.g., `PlaylistHandlers`).
- **URL Paths**: `kebab-case` (e.g., `/api/v1/auth/signup-with-org`).

## 5. TypeScript Types & Interfaces

- **Input DTOs**: `{Action}{Domain}Input` (e.g., `CreatePlaylistInput`).
- **Inferred Schema Types**: Named exports in schema files (`AuthUser`, `NewAuthUser`).
- **Prefixes**: Do **NOT** use `I` or `T` prefixes (e.g., use `UserRepository`, not `IUserRepository`).

## 6. Files & Folders

- **Naming Rule**: `kebab-case`.
- **Standard**: `user-profile.service.ts`, `auth.routes.ts`.

---
Last updated: 2026-03-30
