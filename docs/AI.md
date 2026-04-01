<!-- LAST_UPDATED: 2026-03-30 -->
<!-- AI_CONTEXT -->
<!-- This is the canonical reference for AI-assisted development. -->

# AI-Ready Architecture Reference

> Read this before generating any code for Entix-App.

## 🧱 Core Stack
## 🧱 Core Stack
- **Runtime**: Cloudflare Workers (Edge-native V8 isolates).
- **Framework**: Hono with `@hono/zod-openapi`.
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM.
- **Auth**: Better Auth (strictly in Service layer, `auth.api.*`).
- **Validation**: Zod (all request/response schemas).
- **Styles**: Tailwind CSS v4 + Ant Design.

## 🛡️ Strict Architectural Rules (Never Violate)
1.  **Dumb Repositories**: Repositories MUST NOT import Auth, Stripe, or external clients. Allowed Dependencies: `AppDb` (Drizzle) only.
2.  **No Exceptions in Repos**: Repositories must return `null` for not-found. Never throw `AppError`.
3.  **Service Isolation**: Handlers never call repositories. Services never use `db` directly.
4.  **BaseService Protocol**: Services MUST extend `BaseService`. Use `assertExists()` for `get*` methods.
5.  **Naming Standards (Rule 35)**: Repository methods should be concise and avoid domain redundancy. 
    - **Single lookup**: `findById`, `findByCode`.
    - **Collection lookup**: `findAll`, `findByOrgId`.
    - **Existence check**: `existsById`, `existsByUserId`.
    - **Actions**: `insert`, `update`, `delete`, `deactivate`, `archive`.
6.  **Data Integrity**: Coerce `undefined` to `null` on all database reads (`?? null`).

## 🗺️ Layer Responsibilities
| Layer | File Pattern | Allowed Dependencies | Prohibited |
| :--- | :--- | :--- | :--- |
| **Repository** | `*.repository.ts` | `AppDb` (Drizzle) only | Auth, external APIs, AppError throws |
| **Service** | `*.service.ts` | Repository, Auth, external clients | `db` directly, direct HTTP access |
| **Handler** | `*.handlers.ts` | Service factory functions | Repository factories, `db` instantiation |
| **Factory** | `*.factory.ts` | `ctx` bindings | Business logic |

## 🏷️ Naming Quick Reference
- **Repo Single**: `findById`, `findByEmail`, `findByCode`.
- **Repo Collection**: `findAll`, `findByOrgId`, `findByUserId`.
- **Repo Actions**: `insert`, `update`, `delete`, `deactivate`, `archive`, `prepareInsert`.
- **Service Reads**: `find*` (nullable), `get*` (throws).
- **Service Actions**: Business verbs (`addMember`, `transferOwnership`).
- **Input DTOs**: `{Action}{Domain}Input` (e.g., `CreatePlaylistInput`).
- **Route Constants**: `{action}{Domain}Route` (e.g., `listPlaylistsRoute`).

## 🧪 Testing Patterns
- **Service Tests**: Mock Repository using `vi.fn()`, mock Auth using `mockAuth()`.
- **Repository Tests**: Use real Drizzle against a local D1 instance.
- **Assertion**: Every `get*` method must have a `NotFoundError` test case.

## 🚀 Minimal Feature Workflow
1. **Schema**: Define `sqliteTable` in `shared/db/schema/`.
2. **Repository**: Implement `find*`/`insert*` in `api/repositories/`.
3. **Service**: Implement `find*`/`get*` / business verbs in `api/services/`.
4. **Factory**: Register in `api/factories/`.
5. **Route**: Define `createRoute` in `api/routes/`.
6. **Handler**: Implement `AppHandler` in `api/routes/`.

---
**Verification**: All generated code must pass `npm run typecheck:api`.
