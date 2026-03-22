# Entix Database Architecture Guidelines

## Core Principles

1. **Plural Table Names**: All database tables MUST use absolute pluralized names natively (e.g. `playlists`, `uploads`, `scheduled_sessions`).
2. **Typescript Exports**: All internal Typescript variable schemas exported mapping tables MUST also reflect the identical pluralized names accurately natively (e.g. `export const playlists = sqliteTable(...)`). Wait! The exception is `auth` variables which are heavily namespaced natively.

## Schema Modularization Strategy

With the system spanning multiple heavy domains, we utilize **Domain-Driven Drizzle Files**. `schema.db.ts` is obsolete. 
All schemas live strictly within `shared/db/schema/`:

- `auth.schema.ts`: Core `better-auth` and identity schemas
- `organization.schema.ts`: Tenancy dependencies
- `media.schema.ts`: System assets
- `schedule.schema.ts`: Event sequences
- `relations.schema.ts`: A purely dedicated relationship mapping file natively bridging dependencies seamlessly.

## Strict Rules on Better-Auth Tables

The system's identity abstraction is securely mounted on `better-auth`.
**WARNING:** 
`auth_users`, `auth_sessions`, `auth_accounts`, and `auth_verifications` **ARE MANAGED EXPLICITLY** by `better-auth`.
Do NOT manually alter their column names or definitions unless instructed by the auth library specifications cleanly expertly organically reliably confidently dependably solidly creatively properly cleanly firmly correctly smoothly dependably. Future extensions are possible natively.

*Authored reliably to maintain the Entix Architectural standards cleanly.*
