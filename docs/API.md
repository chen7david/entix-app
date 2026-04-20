<!-- AI_CONTEXT -->
<!-- LAST_UPDATED: 2026-04-01 -->
<!-- VERSION: 1.2.0 -->
<!-- Canonical backend reference for AI-assisted development on Entix-App. -->
<!-- Stack: Cloudflare Workers, Hono, Drizzle ORM, D1 (SQLite), Better Auth, Zod, TypeScript -->
<!-- Enforce: All rules below are MANDATORY. Violations = bugs. -->

# API.md — Backend Architecture Reference
# Entix-App API Layer

> Read this before generating any code for the Entix-App API layer.
> Every rule is numbered for reference in code reviews and audit reports.
> Violations should be treated as bugs, not style preferences.

---

## Rule Index

| #   | Rule                        | Section                |
|-----|-----------------------------|------------------------|
| 1   | Dumb Repositories           | Strict Rules           |
| 2   | No Exceptions in Repos      | Strict Rules           |
| 3   | Service Isolation           | Strict Rules           |
| 4   | BaseService Protocol        | Strict Rules           |
| 5   | Naming Standards            | Strict Rules           |
| 6   | Data Integrity              | Strict Rules           |
| 7   | Cursor Pagination Mandate   | Strict Rules           |
| 8   | Table Naming                | Database Schema        |
| 9   | Column Naming               | Database Schema        |
| 10  | Primary Key Standard        | Database Schema        |
| 11  | Required Table Fields       | Database Schema        |
| 12  | Foreign Key Pattern         | Database Schema        |
| 13  | AppError Usage              | Error Handling         |
| 14  | No Handler Catches          | Error Handling         |
| 15  | No Generic Errors           | Error Handling         |
| 16  | Repo Constraint Handling    | Error Handling         |
| 17  | Auth Layer Restriction      | Auth Rules             |
| 18  | Session Access Pattern      | Auth Rules             |
| 19  | Org Context Assertion       | Auth Rules             |
| 20  | When to Use Transactions    | Transaction Pattern    |
| 21  | prepareInsert Pattern       | Transaction Pattern    |
| 22  | No Batch Returning          | Transaction Pattern    |
| 23  | List Response Shape         | Response Standards     |
| 24  | Single Resource Shape       | Response Standards     |
| 25  | Mutation Response Shape     | Response Standards     |
| 26  | Delete Response Shape       | Response Standards     |
| 27  | No Raw Arrays               | Response Standards     |
| 28  | No Inline Mock Data         | Test Architecture      |
| 29  | Factory Location & Naming   | Test Architecture      |
| 30  | Factory Function Pattern    | Test Architecture      |
| 31  | Repository Mock Factory     | Test Architecture      |
| 32  | Mock Reset Strategy         | Test Architecture      |
| 33  | AAA Structure               | Test Best Practices    |
| 34  | One Assertion Per Test      | Test Best Practices    |
| 35  | Test Names are Sentences    | Test Best Practices    |
| 36  | No Implementation Details   | Test Best Practices    |
| 37  | 20-Line Test Limit          | Test Best Practices    |
| 38  | describe Grouping           | Test Best Practices    |
| 39  | Service Test Pattern        | Test Patterns          |
| 40  | Repository Test Pattern     | Test Patterns          |
| 41  | NotFoundError Coverage      | Test Patterns          |
| 42  | When to Write Tests         | Test Patterns          |
| 43  | Factory Registration        | Feature Workflow       |
| 44  | Workflow Order              | Feature Workflow       |
| 45  | Narrow Error Catching       | Error Handling         |
| 46  | When to Update API.md       | Documentation          |
| 47  | Typecheck Gate              | Verification           |

---

## 🧱 Core Stack

- **Runtime**: Cloudflare Workers (Edge-native V8 isolates)
- **Framework**: Hono with `@hono/zod-openapi`
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Auth**: Better Auth (strictly in Service layer via `auth.api.*`)
- **Validation**: Zod (all request/response schemas)
- **ID Generation**: Use **`shared/lib/id.ts`** (`generateOpaqueId`, `generateTransactionId`, etc.); **`nanoid` only inside that module**. Services mint IDs before insert for batches and any flow that needs the id early; repositories never import `nanoid`. Drizzle **`$defaultFn`** may call the same helpers **only** for simple single-table inserts (see [ID generation](./conventions/02-id-generation) — hybrid policy).

---

## 🛡️ Strict Architectural Rules

### Rule 1 — Dumb Repositories
Repositories MUST NOT import Auth, Stripe, **`nanoid`**, or any external client. (IDs come from services via **`@shared/lib/id`** helpers, not raw `nanoid`.)
Allowed dependency: `AppDb` (Drizzle) only.

### Rule 2 — No Exceptions in Repos
Repositories MUST return `null` for not-found results. Never throw `AppError` or
generic `Error` objects. The decision to throw belongs exclusively to the Service layer.

### Rule 3 — Service Isolation
- Handlers MUST NEVER call repositories directly.
- Services MUST NEVER use `db` directly — always through a repository.
- Cross-service calls are permitted. Cross-repository calls from handlers are not.

### Rule 4 — BaseService Protocol
All services MUST extend `BaseService`. Use `assertExists()` for all `get*` methods.
`find*` methods return `T | null`. `get*` methods return `T` or throw `NotFoundError`.

```ts
// ✅ Correct
async getMember(id: string): Promise<Member> {
    return this.assertExists(await this.repo.findById(id), 'Member');
}

async findMember(id: string): Promise<Member | null> {
    return this.repo.findById(id);
}
```

### Rule 5 — Naming Standards
Repository methods MUST be concise. The class name carries the domain — never repeat it.

| Operation      | Pattern                              | Example               |
|----------------|--------------------------------------|-----------------------|
| Single lookup  | `findById`, `findByEmail`            | `findById(id)`        |
| Collection     | `findAll`, `findByOrgId`             | `findByOrgId(orgId)`  |
| Existence      | `existsById`, `existsByUserId`       | `existsByUserId(uid)` |
| Insert         | `insert`                             | `insert(input)`       |
| Update         | `update`, `updateRole`, `deactivate` | `update(id, input)`   |
| Delete         | `delete`                             | `delete(id)`          |
| Batch prepare  | `prepareInsert`                      | `prepareInsert(input)`|

Service naming:
- `find*` → nullable, returns `T | null`
- `get*` → asserting, throws `NotFoundError` if not found
- Business verbs → domain actions (`addMember`, `transferOwnership`)

Input DTOs: `{Action}{Domain}Input` → `CreatePlaylistInput`
Route constants: `{action}{Domain}Route` → `listPlaylistsRoute`

### Rule 6 — Data Integrity
All `findFirst` Drizzle queries MUST coerce `undefined` to `null` using `?? null`.
Never return `undefined` to the Service layer.

```ts
// ✅ Correct
async findById(id: string): Promise<Member | null> {
    return await this.db.query.members.findFirst({
        where: eq(schema.members.id, id),
    }) ?? null;
}
```

### Rule 7 — Cursor Pagination Mandate
Every list route MUST use cursor-based pagination.
Offset-based pagination is prohibited. Use `buildCursorPagination` and
`processPaginatedResult` helpers exclusively.

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
export const financialAccounts = sqliteTable('financial_accounts', { ... });
export const authMembers = sqliteTable('auth_members', { ... });
```

### Rule 9 — Column Naming
- SQL column names: `snake_case`
- TypeScript/Drizzle column references: `camelCase`

### Rule 10 — Primary Key Standard
Never use auto-increment integers as primary keys.
All primary keys MUST be opaque strings (21-char `nanoid` or prefixed helpers from **`shared/lib/id.ts`**), generated in the Service layer before insert.

```ts
import { generateOpaqueId } from "@shared";

// ✅ id generated in Service, passed into Repository
const member = await this.repo.insert({ id: generateOpaqueId(), ...input });
```

### Rule 11 — Required Table Fields
Every table MUST include:
- `id` — `text` primary key, nanoid string
- `createdAt` — `integer` timestamp, set at insert time

### Rule 12 — Foreign Key Pattern
Foreign key columns MUST use the full `{domain}Id` pattern.
`organizationId`, `userId`, `accountId`.
Never abbreviate (`orgId` as a column name is prohibited).

---

## ⚠️ Error Handling

### Rule 13 — AppError Usage
Services throw `AppError` (extends `HTTPException`) for all domain errors.

```ts
throw new AppError(404, 'Member not found');
throw new AppError(409, 'Member already exists in this organization');
```

### Rule 14 — No Handler Catches
Handlers MUST NOT wrap service calls in `try/catch`.
The shared error middleware handles all `AppError` and `HTTPException` globally.

### Rule 15 — No Generic Errors [MANDATORY]
Never throw `new Error(...)` anywhere in the stack, especially in Services.
All thrown errors MUST be `AppError` subclasses with a meaningful HTTP status. Generic `Error` objects bypass structured logging and context enrichment in the global error handler.

### Rule 16 — Repo Constraint Handling
Database constraint violations thrown by Drizzle inside a Repository MUST be caught
in the Service layer, not the Repository. Repositories propagate raw Drizzle errors
upward — Services interpret them.

### Rule 45 — Narrow Error Catching [MANDATORY]
Never type caught errors as `any`. Use `unknown` and narrow with `instanceof`. `catch (error: any)` is strictly prohibited as it defeats TypeScript's type safety during critical error restoration. All services MUST type caught errors as `unknown`.

```ts
// ✅ Correct
try { ... } catch (error: unknown) {
  if (error instanceof ConflictError) { ... }
}

// ❌ Prohibited
try { ... } catch (error: any) { ... }
```

---

## 🔐 Auth Rules

### Rule 17 — Auth Layer Restriction
`auth.api.*` MUST only be called inside Services.
Never access `auth` in Repositories, Handlers, or Factories.

### Rule 18 — Session Access Pattern
```ts
const session = await auth.api.getSession({ headers: ctx.headers });
```

### Rule 19 — Org Context Assertion
Every org-scoped operation MUST call `MemberService.assertMembership(userId, organizationId)`
before proceeding. Never assume membership from the request alone.

---

## 🔄 Transaction Pattern

### Rule 20 — When to Use Transactions
Use `db.batch()` when two or more mutations must succeed or fail atomically.
Never use sequential awaited inserts for operations that must be atomic.

### Rule 21 — prepareInsert Pattern
Repositories expose `prepareInsert(input)` returning an un-awaited Drizzle query.
Services compose these into a single `db.batch([...])` call.

```ts
import { generateOpaqueId } from "@shared";

// Repository
prepareInsert(input: InsertMemberInput) {
    return this.db.insert(schema.authMembers).values(input);
}

// Service — atomic batch
const q1 = this.orgRepo.prepareInsert({ id: generateOpaqueId(), ...orgInput });
const q2 = this.memberRepo.prepareInsert({ id: generateOpaqueId(), ...memberInput });
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
```ts
{ data: T[], nextCursor: string | null, total?: number }
```

### Rule 24 — Single Resource Response Shape
```ts
{ data: T }
```

### Rule 25 — Mutation Response Shape
All create and update endpoints return the affected record:
```ts
{ data: T }
```

### Rule 26 — Delete Response Shape
```ts
{ success: true }
```

### Rule 27 — No Raw Arrays
Never return a raw array at the top level. All arrays MUST be wrapped in `data`.

---

## 🗺️ Layer Responsibilities

| Layer          | File Pattern      | Allowed Dependencies               | Prohibited                           |
|----------------|-------------------|------------------------------------|--------------------------------------|
| **Repository** | `*.repository.ts` | `AppDb` (Drizzle) only             | Auth, external APIs, AppError throws |
| **Service**    | `*.service.ts`    | Repository, Auth, external clients | `db` directly, direct HTTP           |
| **Handler**    | `*.handlers.ts`   | Service factory functions only     | Repository factories, `db`           |
| **Factory**    | `*.factory.ts`    | `ctx` bindings                     | Business logic                       |

---

## 🧪 Test Architecture

### Rule 28 — No Inline Mock Data
Never define mock objects inline inside a test. All test data lives in a factory function.

```ts
// ❌ Prohibited
const member = { id: '123', userId: 'u1', organizationId: 'o1', role: 'admin', createdAt: new Date() };

// ✅ Correct
const member = makeMember();
const admin = makeMember({ role: 'admin' });
```

### Rule 29 — Factory Location & Naming
```text
tests/
  factories/
    member.factory.ts        ← makeMember(overrides?)
    organization.factory.ts  ← makeOrganization(overrides?)
    session.factory.ts       ← makeSession(overrides?)
  mocks/
    member.repository.mock.ts  ← makeMemberRepoMock()
    auth.mock.ts               ← makeAuthMock()
  unit/
    member.service.test.ts
    member.repository.test.ts
```

### Rule 30 — Factory Function Pattern
Every factory accepts optional overrides so tests only specify what matters:

```ts
// tests/factories/member.factory.ts
export const makeMember = (overrides: Partial<Member> = {}): Member => ({
    id: 'member-test-id',
    userId: 'user-test-id',
    organizationId: 'org-test-id',
    role: 'student',
    createdAt: new Date('2026-01-01'),
    ...overrides,
});
```

### Rule 31 — Repository Mock Factory
Every repository gets a typed mock factory. Never hand-roll `vi.fn()` per test.

```ts
// tests/mocks/member.repository.mock.ts
export const makeMemberRepoMock = (): Mocked<MemberRepository> => ({
    findById: vi.fn(),
    findByOrgId: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    existsByUserId: vi.fn(),
});
```

Every service test starts identically:
```ts
const repo = makeMemberRepoMock();
const service = new MemberService(repo);
```

### Rule 32 — Mock Reset Strategy
Never manually call `mockReset()` on individual mocks. Reset globally in `beforeEach`:

```ts
beforeEach(() => {
    vi.resetAllMocks();
});
```

---

## ✅ Test Best Practices

### Rule 33 — AAA Structure
Every test MUST follow Arrange → Act → Assert. Never mix the three phases.

```ts
it('should throw NotFoundError when member does not exist', async () => {
    // Arrange
    repo.findById.mockResolvedValue(null);

    // Act
    const result = service.getMember('missing-id');

    // Assert
    await expect(result).rejects.toThrow(NotFoundError);
});
```

### Rule 34 — One Assertion Per Test
A test that asserts multiple unrelated things fails for unclear reasons. Split concerns
into separate tests.

### Rule 35 — Test Names are Sentences
Test names MUST read as plain English sentences describing observable behaviour,
not implementation details.

```ts
// ❌ Implementation-focused
it('calls findById and assertExists')

// ✅ Behaviour-focused
it('should throw NotFoundError when the requested member does not exist')
it('should return the member when found')
it('should prevent adding a duplicate member to the same organization')
```

### Rule 36 — No Implementation Details
Only assert on:
- Return values
- Thrown errors
- Calls to injected dependencies (repos, auth)

Never assert on private methods, internal state, or intermediate variables.

### Rule 37 — 20-Line Test Limit
If a test exceeds ~20 lines, the setup is too complex. Extract setup into
`beforeEach` or a dedicated helper function.

### Rule 38 — describe Grouping
Group tests by method using nested `describe` blocks:

```ts
describe('MemberService', () => {
    describe('getMember', () => {
        it('should return member when found', ...);
        it('should throw NotFoundError when not found', ...);
    });

    describe('addMember', () => {
        it('should insert and return the new member', ...);
        it('should throw ConflictError if already a member', ...);
    });
});
```

---

## 🧪 Test Patterns

### Rule 39 — Service Test Pattern
Mock Repository with `vi.fn()` via the mock factory (Rule 31).
Mock Auth with `makeAuthMock()`. Never test Services against a real database.

### Rule 40 — Repository Test Pattern
Repository tests use real Drizzle against a local D1 instance.
Never mock the database in Repository tests.
Only write Repository tests for complex query logic — not simple CRUD.

### Rule 41 — NotFoundError Coverage
Every `get*` Service method MUST have a test that:
1. Mocks the repository to return `null`
2. Asserts `NotFoundError` is thrown via `assertExists`

```ts
it('should throw NotFoundError when member does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getMember('missing-id')).rejects.toThrow(NotFoundError);
});
```

### Rule 42 — When to Write Tests

**New feature (Rule 44 workflow):**
- Service unit tests are MANDATORY before the PR is opened.
- Every `get*` method: NotFoundError test case (Rule 41).
- Every business verb: happy path + domain error case.
- Repository tests only for complex query logic.

**Refactor:**
- If method signatures change: update tests before renaming.
- If a repo method is renamed: update all service mocks that reference it.
- If error handling changes: add/update the corresponding service test.

**Bug fix:**
- Write a failing test that reproduces the bug FIRST, then fix it.
- Test name MUST describe the bug: `should not allow duplicate membership`.

---

## 🚀 Feature Workflow

### Rule 43 — Factory Registration
Every Service MUST be instantiated via a factory that receives `ctx` bindings.

```ts
// ✅ Correct factory pattern
export const createMemberService = (ctx: AppContext) =>
    new MemberService(
        new MemberRepository(ctx.db),
        ctx.auth,
    );
```

### Rule 44 — Workflow Order
Follow this order exactly. Never skip or reorder steps.

1. **Schema** — Define `sqliteTable` in `shared/db/schema/`
2. **Migration** — Generate and apply Drizzle migration
3. **Repository** — Implement `find*` / `insert` / `update` / `delete` in `api/repositories/`
4. **Service** — Implement `find*` / `get*` / business verbs in `api/services/`
5. **Factory** — Register `create{Domain}Service` in `api/factories/`
6. **Route** — Define `createRoute` with Zod request/response schemas in `api/routes/`
7. **Handler** — Implement `AppHandler` consuming the Service factory in `api/routes/`
8. **Tests** — Service unit tests including NotFoundError cases (Rule 41)

---

## 📝 Documentation

### Rule 45 — When to Update API.md
Update this document immediately when any of the following occur:
- A new architectural pattern is introduced (new base class, helper, convention).
- A naming rule is refined or a rule is deprecated.
- A new layer or file type is added to the stack.
- A rule is violated and fixed — document it so it does not recur.

Do NOT update for:
- Feature-specific implementation details.
- One-off workarounds — fix the code instead.

Rule numbers are **permanent reference handles** and MUST NOT be renumbered.
Retired rules MUST be marked `[DEPRECATED]` — never deleted.

---

## ✅ AI Generation Checklist

Before submitting any generated code, verify every item:

- [ ] Repository has zero non-Drizzle imports
- [ ] All `findFirst` calls use `?? null` coercion
- [ ] Service `get*` methods call `assertExists()`
- [ ] Service `find*` methods return `T | null`
- [ ] IDs created via **`@shared/lib/id`** helpers (or `generateOpaqueId`) in Service layer, never raw `nanoid` outside `shared/lib/id.ts`, never in Repository
- [ ] Handler calls only Service factory functions — no direct repo access
- [ ] All list routes use cursor pagination via `buildCursorPagination`
- [ ] All responses wrapped in `{ data: T }` or `{ data: T[], nextCursor }`
- [ ] No generic `Error` throws — only `AppError`
- [ ] Auth accessed only inside Services via `auth.api.*`
- [ ] Atomic multi-insert operations use `db.batch()` with `prepareInsert`
- [ ] Tests written before PR is opened (Rule 42)
- [ ] `npm run typecheck:api` passes with zero errors

### Rule 46 — Typecheck Gate
All generated or refactored code MUST pass `npm run typecheck:api` with zero errors
before a PR is opened. Type errors are bugs.

---

*API.md — Entix-App Backend Architecture Reference*
*Version: 1.2.0 (Last Updated: 2026-04-01)*