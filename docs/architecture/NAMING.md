# Database Naming Conventions

This project follows the **Implicit Org Scope** philosophy for database and architectural naming.

## 1. Implicit Organizational Scope

By default, any resource represented by a table name without a specific prefix (e.g., `uploads`, `media`, `playlists`) is **implicitly scoped to an organization**.

- **Table Name**: Generic (e.g., `uploads`).
- **Required Field**: `organization_id` (not null).
- **Rationale**: In a multi-tenant system, the majority of data belongs to a tenant. Making this the "default" state reduces cognitive load and simplifies common queries.

## 2. Explicit User Scope

Resources that are owned by a global user and exist independently of any specific organization membership MUST be explicitly prefixed with `user_`.

- **Table Name**: Prefixed (e.g., `user_uploads`, `user_profiles`).
- **Required Field**: `user_id` (not null).
- **Rationale**: This distinguishes personal data (account portability, global settings) from tenant data.

## 3. Implementation Guidelines

### Repository Layer
- Scoped repositories should always require an `organizationId` in their lookup and mutation methods.
- Global repositories use `userId`.

### Service Layer
- Services coordinating both types should have clear, distinct method names (e.g., `createUpload` vs `createUserUpload`).

### API Routes
- Organizational routes: `/api/v1/orgs/:orgId/...`
- Global user routes: `/api/v1/users/:userId/...`
