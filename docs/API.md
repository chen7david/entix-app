<!-- AI_CONTEXT -->
<!-- LAST_UPDATED: 2026-04-01 -->
<!-- VERSION: 1.1.0 -->
<!-- This is the canonical backend reference for AI-assisted development on Entix-App. -->
<!-- Stack: Cloudflare Workers, Hono, Drizzle ORM, D1 (SQLite), Better Auth, Zod, TypeScript -->
<!-- Enforce: All rules below are MANDATORY. Violations = bugs. -->

# AI.md — Backend Architecture Reference
# Entix-App API Layer

> Read this before generating any code for the Entix-App API layer.
> Every rule is numbered for reference in code reviews and audit reports.
> Violations should be treated as bugs, not style preferences.

---

## Rule Index
| #  | Rule                        | Section                  |
|----|-----------------------------|--------------------------|
| 1  | Dumb Repositories           | Strict Rules             |
| 2  | No Exceptions in Repos      | Strict Rules             |
| 3  | Service Isolation           | Strict Rules             |
| 4  | BaseService Protocol        | Strict Rules             |
| 5  | Naming Standards            | Strict Rules             |
| 6  | Data Integrity              | Strict Rules             |
| 7  | Cursor Pagination Mandate   | Strict Rules             |
| 8  | Table Naming                | Database Schema          |
| 9  | Column Naming               | Database Schema          |
| 10 | Primary Key Standard        | Database Schema          |
| 11 | Required Table Fields       | Database Schema          |
| 12 | Foreign Key Pattern         | Database Schema          |
| 13 | AppError Usage              | Error Handling           |
| 14 | No Handler Catches          | Error Handling           |
| 15 | No Generic Errors           | Error Handling           |
| 16 | Repo Constraint Handling    | Error Handling           |
| 17 | Auth Layer Restriction      | Auth Rules               |
| 18 | Session Access Pattern      | Auth Rules               |
| 19 | Org Context Assertion        | Auth Rules               |
| 20 | Transaction Pattern         | Transaction Pattern      |
| 21 | prepareInsert Pattern       | Transaction Pattern      |
| 22 | No Batch Returning          | Transaction Pattern      |
| 23 | List Response Shape         | Response Standards       |
| 24 | Single Resource Shape       | Response Standards       |
| 25 | Mutation Response Shape     | Response Standards       |
| 26 | Delete Response Shape       | Response Standards       |
| 27 | No Raw Arrays               | Response Standards       |
| 28 | Service Mock Pattern        | Testing Patterns         |
| 29 | Repo Test Pattern           | Testing Patterns         |
| 30 | NotFoundError Coverage      | Testing Patterns         |
| 31 | Factory Registration        | Feature Workflow         |
| 32 | Workflow Order              | Feature Workflow         |
| 33 | Typecheck Gate              | Verification             |

---

## 🧱 Core Stack

- **Runtime**: Cloudflare Workers (Edge-native V8 isolates)
- **Framework**: Hono with `@hono/zod-openapi`
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Auth**: Better Auth (strictly in Service layer via `auth.api.*`)
- **Validation**: Zod (all request/response schemas)
- **ID Generation**: `nanoid` (Service layer only — never in Repositories)

---

## 🛡️ Strict Architectural Rules

### Rule 1 — Dumb Repositories
Repositories MUST NOT import Auth, Stripe, nanoid, or any external client.
Allowed dependency: `AppDb` (Drizzle) only.

### Rule 2 — No Exceptions in Repos
Repositories MUST return `null` for not-found results. Never throw `AppError` or
generic `Error` objects. The decision to throw belongs exclusively to the Service layer.

### Rule 3 — Service Isolation
- Handlers MUST NEVER call repositories directly.
- Services MUST NEVER use `db` directly — always through a repository.
- Cross-service calls are permitted; cross-repository calls from handlers are not.

### Rule 4 — BaseService Protocol
- All services MUST extend `BaseService`.
- All `get*` methods MUST use `assertExists()` to surface `NotFoundError`.
- All `find*` methods return `T | null` — nullable, never throws.

```ts
// ✅ Correct pattern
async getMember(id: string): Promise<Member> {
    return this.assertExists(await this.repo.findById(id), 'Member');
}

async findMember(id: string): Promise<Member | null> {
    return this.repo.findById(id);
}
```

### Rule 5 — Naming Standards
Repository methods MUST be concise and avoid domain redundancy
(the class name already carries the domain context).

| Operation        | Pattern                              | Example                        |
|------------------|--------------------------------------|--------------------------------|
| Single lookup    | `findById`, `findByEmail`            | `findById(id)`                 |
| Collection       | `findAll`, `findByOrgId`             | `findByOrgId(orgId)`           |
| Existence check  | `existsById`, `existsByUserId`       | `existsByUserId(userId)`       |
| Insert           | `insert`                             | `insert(input)`                |
| Update           | `update`, `updateRole`, `deactivate` | `update(id, input)`            |
| Delete           | `delete`                             | `delete(id)`                   |
| Batch prepare    | `prepareInsert`                      | `prepareInsert(input)`         |

Service method naming:
- `find*` → nullable read, returns `T | null`
- `get*` → asserting read, throws `NotFoundError` if not found
- Business verbs → domain actions (`addMember`, `transferOwnership`, `activateCurrency`)

### Rule 6 — Data Integrity
All `findFirst` Drizzle queries MUST coerce `undefined` to `null` at the repository
boundary using `?? null`. Never return `undefined` to the Service layer.

```ts
// ✅ Correct
async findById(id: string): Promise<Member | null> {
    return await this.db.query.members.findFirst({
        where: eq(schema.members.id, id),
    }) ?? null;
}
```

### Rule 7 — Cursor Pagination Mandate
Every list route MUST support cursor-based pagination.
Offset-based pagination is prohibited for scalability reasons.
Use `buildCursorPagination` and `processPaginatedResult` helpers exclusively.

```ts
// ✅ Correct
const pagination = buildCursorPagination(query.cursor, query.limit);
const raw = await this.repo.findByOrgId(orgId, pagination);
return processPaginatedResult(raw, query.limit);
```

---

## 🗄️ Database Schema Standards

### Rule 8 — Table Naming
Table names MUST use plural `snake_case`.
```ts
// ✅ Correct
export const financialAccounts = sqliteTable('financial_accounts', { ... });
export const authMembers = sqliteTable('auth_members', { ... });
```

### Rule 9 — Column Naming
- SQL column names: `snake_case`
- TypeScript/Drizzle column references: `camelCase`

### Rule 10 — Primary Key Standard
Never use auto-increment integers as primary keys.
All primary keys MUST be `nanoid` strings, generated in the Service layer before insert.

```ts
// ✅ Correct — id generated in Service, passed to Repository
const member = await this.repo.insert({ id: nanoid(), ...input });
```

### Rule 11 — Required Table Fields
Every table MUST include:
- `id` — `text` primary key, nanoid string
- `createdAt` — `integer` timestamp, set at insert time

### Rule 12 — Foreign Key Pattern
Foreign key columns MUST follow the `{domain}Id` pattern:
`organizationId`, `userId`, `accountId`.
Never abbreviate (`orgId` as a column name is prohibited — use `organizationId`).

---

## ⚠️ Error Handling

### Rule 13 — AppError Usage
Services throw `AppError` (which extends `HTTPException`) for all domain errors.
```ts
// ✅ Correct
throw new AppError(404, 'Member not found');
throw new AppError(409, 'Member already exists in this organization');
```

### Rule 14 — No Handler Catches
Handlers MUST NOT wrap service calls in `try/catch`.
The shared error middleware handles all `AppError` and `HTTPException` instances globally.

### Rule 15 — No Generic Errors
Never throw `new Error(...)` anywhere in the stack.
All thrown errors MUST be `AppError` instances with a meaningful HTTP status and message.

### Rule 16 — Repo Constraint Handling
Database constraint violations (unique key, foreign key) thrown by Drizzle inside a
Repository MUST be caught in the Service layer, not the Repository.
Repositories propagate raw Drizzle errors upward — Services interpret them.

---

## 🔐 Auth Rules

### Rule 17 — Auth Layer Restriction
`auth.api.*` MUST only be called inside Services.
Never access `auth` in Repositories, Handlers, or Factories.

### Rule 18 — Session Access Pattern
Session reads in Services use the raw request headers passed from the handler context:
```ts
const session = await auth.api.getSession({ headers: ctx.headers });
```

### Rule 19 — Org Context Assertion
Every org-scoped operation MUST verify membership before proceeding.
Use `MemberService.assertMembership(userId, organizationId)` at the start of any
service method that operates on organization-owned resources.

---

## 🔄 Transaction Pattern

### Rule 20 — When to Use Transactions
Use `db.batch()` when two or more inserts or mutations must succeed or fail atomically.
Never use sequential awaited inserts for operations that must be atomic.

### Rule 21 — prepareInsert Pattern
Repositories expose `prepareInsert(input)` returning an un-awaited Drizzle query object.
Services compose these into a single `db.batch([...])` call.

```ts
// Repository
prepareInsert(input: InsertMemberInput) {
    return this.db.insert(schema.authMembers).values(input);
}

// Service — atomic batch
const q1 = this.orgRepo.prepareInsert({ id: nanoid(), ...orgInput });
const q2 = this.memberRepo.prepareInsert({ id: nanoid(), ...memberInput });
await this.db.batch([q1, q2]);
```

### Rule 22 — No .returning() in Batches
Never chain `.returning()` on batched queries — D1 does not support it.
Use a follow-up `findById` after the batch to retrieve the inserted record.

```ts
// ✅ Correct
await this.db.batch([q1, q2]);
return this.assertExists(await this.repo.findById(id), 'Organization');
```

---

## 📤 Response Standards

### Rule 23 — List Response Shape
All list endpoints MUST return:
```ts
{ data: T[], nextCursor: string | null, total?: number }
```

### Rule 24 — Single Resource Response Shape
All single-resource endpoints MUST return:
```ts
{ data: T }
```

### Rule 25 — Mutation Response Shape
All create and update endpoints MUST return the affected record:
```ts
{ data: T }
```

### Rule 26 — Delete Response Shape
Delete endpoints return:
```ts
{ success: true }
```

### Rule 27 — No Raw Arrays
Never return a raw array at the top level of a response.
All arrays MUST be wrapped in a `data` property.

---

## 🗺️ Layer Responsibilities

| Layer          | File Pattern        | Allowed Dependencies              | Prohibited                          |
|----------------|---------------------|-----------------------------------|-------------------------------------|
| **Repository** | `*.repository.ts`   | `AppDb` (Drizzle) only            | Auth, external APIs, AppError throws|
| **Service**    | `*.service.ts`      | Repository, Auth, external clients| `db` directly, direct HTTP access   |
| **Handler**    | `*.handlers.ts`     | Service factory functions only    | Repository factories, `db`          |
| **Factory**    | `*.factory.ts`      | `ctx` bindings                    | Business logic                      |

---

## 🧪 Testing Patterns

### Rule 28 — Service Test Pattern
Mock Repository with `vi.fn()`. Mock Auth with `mockAuth()`.
Never test Services against a real database.

```ts
const mockRepo = { findById: vi.fn(), insert: vi.fn() };
const service = new MemberService(mockRepo, mockAuth());
```

### Rule 29 — Repository Test Pattern
Repository tests use real Drizzle against a local D1 instance.
Never mock the database in Repository tests.

### Rule 30 — NotFoundError Coverage
Every `get*` Service method MUST have a test case that:
1. Mocks the repository to return `null`
2. Asserts that `NotFoundError` is thrown via `assertExists`

```ts
it('should throw NotFoundError if member does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getMember('missing-id')).rejects.toThrow(NotFoundError);
});
```

---

## 🚀 Minimal Feature Workflow

Follow this order exactly. Never skip or reorder steps.

### Rule 31 — Factory Registration
Every Service MUST be instantiated via a factory function that receives `ctx` bindings.
The factory constructs the repository, then the service.

```ts
// ✅ Correct factory pattern
export const createMemberService = (ctx: AppContext) =>
    new MemberService(
        new MemberRepository(ctx.db),
        ctx.auth,
    );
```

### Rule 32 — Workflow Order
1. **Schema** — Define `sqliteTable` in `shared/db/schema/`
2. **Migration** — Generate and apply Drizzle migration
3. **Repository** — Implement `find*` / `insert` / `update` / `delete` in `api/repositories/`
4. **Service** — Implement `find*` / `get*` / business verbs in `api/services/`
5. **Factory** — Register `create{Domain}Service` in `api/factories/`
6. **Route** — Define `createRoute` with Zod request/response schemas in `api/routes/`
7. **Handler** — Implement `AppHandler` consuming the Service factory in `api/routes/`
8. **Tests** — Add Service unit tests, including `NotFoundError` cases (Rule 30)

---

## ✅ AI Generation Checklist

Before submitting any generated code, verify every item:

- [ ] Repository has zero non-Drizzle imports
- [ ] All `findFirst` calls use `?? null` coercion
- [ ] Service `get*` methods call `assertExists()`
- [ ] Service `find*` methods return `T | null`
- [ ] `nanoid()` is called in the Service layer, never in the Repository
- [ ] Handler calls only Service factory functions — no direct repo access
- [ ] All list routes implement cursor pagination via `buildCursorPagination`
- [ ] All responses are wrapped in `{ data: T }` or `{ data: T[], nextCursor }`
- [ ] No generic `Error` throws anywhere — only `AppError`
- [ ] Auth accessed only inside Services via `auth.api.*`
- [ ] Atomic multi-insert operations use `db.batch()` with `prepareInsert`
- [ ] `npm run typecheck:api` passes with zero errors
- [ ] `npm run check:fix` passes with zero errors

---

*AI.md — Entix-App Backend Architecture Reference*
*Version: 1.1.0 (Last Updated: 2026-04-01)*