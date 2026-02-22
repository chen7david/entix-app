# Testing

This project uses [Vitest](https://vitest.dev) with [@cloudflare/vitest-pool-workers](https://github.com/cloudflare/workers-sdk/tree/main/packages/vitest-pool-workers).
Tests run inside the Cloudflare Workers runtime (`workerd`), ensuring behavior matches production.

## Running Tests

```bash
# Run all tests
npm test

# Run a specific file
npx vitest run tests/integration/member.integration.test.ts

# Watch mode (re-runs on file change)
npx vitest
```

## Project Structure

```
tests/
├── integration/        # Full-stack API tests (HTTP → middleware → handler → DB)
├── unit/               # Isolated logic tests (helpers, utilities)
├── factories/          # Data generation factories (DTOs, DB records)
├── lib/                # Test infrastructure
│   ├── test-client/    # Domain-specific API test client
│   ├── auth-test.helper.ts  # Auth & role setup helpers
│   ├── api-request.helper.ts  # Response parsing utilities
│   └── utils.ts        # DB creation & migration helper
└── mocks/              # Mock implementations
```

## Test Layers

We use three distinct layers for test infrastructure, each with a clear responsibility:

| Layer | What it does | Example |
|-------|-------------|---------|
| **Test Client** | Simulates HTTP requests (like a real user) | `client.orgs.members.create(orgId, payload)` |
| **Auth Helpers** | Sets up authentication state and roles | `createAuthenticatedOrg()`, `createSuperAdmin()` |
| **Factories** | Generates valid test data | `createMockMemberCreationPayload()` |

### Why Three Layers?

Each layer solves a specific problem:

- **Factories** answer: *"What data do I send?"*
- **Auth helpers** answer: *"Who is making the request?"*
- **Test client** answers: *"How do I make the request?"*

This separation means that when an API changes, you update the **client**. When a schema changes, you update the **factory**. When auth flows change, you update the **helper**. Tests themselves rarely need to change.

## The Test Client

The test client is a domain-specific API wrapper that eliminates HTTP boilerplate from tests. Tests should read like a description of *what* is being tested, not *how* requests are made.

### Architecture

```
tests/lib/test-client/
├── index.ts            # createTestClient — composes all entity clients
├── base-requester.ts   # Core request function (wraps app.request)
├── auth.client.ts      # Auth endpoints (signUpWithOrg, signIn)
├── members.client.ts   # Member endpoints (create)
└── users.client.ts     # User endpoints (list)
```

### Creating a Client

```typescript
import { createTestClient } from "../lib/test-client";

// Authenticated client (most common)
const client = createTestClient(app, env, sessionCookie);

// Unauthenticated client (for auth endpoints or 401 tests)
const client = createTestClient(app, env);
```

Infrastructure concerns (`app`, `env`, `cookie`) are set **once** when creating the client. Every subsequent call is just domain logic:

```typescript
// ❌ Before — HTTP boilerplate leaks into every test
const res = await authenticatedPost({
    app,
    env,
    path: `/api/v1/orgs/${orgId}/members`,
    body: payload,
    cookie: sessionCookie,
});

// ✅ After — reads like a domain action
const res = await client.orgs.members.create(orgId, payload);
```

### Available Methods

```typescript
const client = createTestClient(app, env, cookie);

// Auth (unauthenticated)
client.auth.signUpWithOrg(payload)     // POST /api/v1/auth/signup-with-org
client.auth.signIn(email, password)    // POST /api/v1/auth/sign-in/email

// Org-scoped resources (authenticated)
client.orgs.users.list(orgId)          // GET  /api/v1/orgs/:orgId/users
client.orgs.members.create(orgId, payload)  // POST /api/v1/orgs/:orgId/members

// Escape hatch for one-off requests
client.request("/api/v1/some/path", { method: "POST", body: data })
```

### Adding a New Resource

To add a new entity (e.g., projects):

**1. Create the entity client:**

```typescript
// tests/lib/test-client/projects.client.ts
import type { Requester } from "./base-requester";

export function createProjectsClient(request: Requester) {
    return {
        list: (orgId: string) =>
            request(`/api/v1/orgs/${orgId}/projects`),
        create: (orgId: string, payload: CreateProjectDTO) =>
            request(`/api/v1/orgs/${orgId}/projects`, { method: "POST", body: payload }),
    };
}
```

**2. Wire it into the index:**

```typescript
// tests/lib/test-client/index.ts
import { createProjectsClient } from "./projects.client";

export function createTestClient(app, env, cookie?) {
    const request = createRequester(app, env, cookie);
    return {
        auth: createAuthClient(request),
        orgs: {
            members: createMembersClient(request),
            users: createUsersClient(request),
            projects: createProjectsClient(request),  // ← add one line
        },
        request,
    };
}
```

No other files need to change.

### Multi-Client Pattern

When testing access control, create separate clients for each role:

```typescript
// Test that different roles have different permissions
const ownerClient = createTestClient(app, env, ownerCookie);
const memberClient = createTestClient(app, env, memberCookie);
const unauthClient = createTestClient(app, env); // no cookie

// Owner can create members
const res1 = await ownerClient.orgs.members.create(orgId, payload);
expect(res1.status).toBe(201);

// Regular member cannot
const res2 = await memberClient.orgs.members.create(orgId, payload);
expect(res2.status).toBe(403);

// Unauthenticated user gets 401
const res3 = await unauthClient.orgs.members.create(orgId, payload);
expect(res3.status).toBe(401);
```

## Auth Helpers

Located in `tests/lib/auth-test.helper.ts`. These create users, organizations, and role assignments.

### Available Helpers

| Helper | Returns | Use Case |
|--------|---------|----------|
| `getAuthCookie({ app, env, user })` | `string` (cookie) | Get a session for a user (signs up if needed) |
| `createAuthenticatedOrg({ app, env })` | `{ cookie, orgId, orgData }` | Create an org + owner session |
| `createOrgMemberWithRole({ app, env, orgId, role, email })` | `{ cookie, userId }` | Add a user to an org with a specific role |
| `createSuperAdmin({ app, env })` | `{ cookie, email }` | Create a platform-level super admin |
| `extractCookies(response)` | `string` (cookie) | Parse Set-Cookie headers from a response |

### Why Direct DB Calls in Helpers?

You'll notice that `createOrgMemberWithRole` and `createSuperAdmin` use direct Drizzle queries instead of going through the API:

```typescript
// Direct DB insertion — intentional!
const db = drizzle(env.DB);
await db.insert(memberTable).values(mockMember);
```

**This is by design.** Test helpers need to set up preconditions *cheaply* without triggering side effects (email flows, invite tokens, etc.). The separation is:

| | Repository (production) | Test Helpers |
|---|---|---|
| **Purpose** | Business logic behind API routes | Set up test preconditions |
| **Called by** | Route handlers, middleware | Test files only |
| **Side effects** | May send emails, validate flows | Bypasses all workflows |
| **Lives in** | `api/` | `tests/lib/` |

Adding a `findUserByEmail` query to the production repository *just* for tests would pollute the production surface area.

## Factories

Located in `tests/factories/`. Each factory generates valid data for a specific schema, with optional overrides.

### Available Factories

| Factory | Generates | Used By |
|---------|-----------|---------|
| `createMockUser()` | User DB record | Unit tests, DB-level tests |
| `createMockMember()` | Member DB record | Direct DB insertion helpers |
| `createMockMemberCreationPayload()` | `CreateMemberDTO` | API integration tests |
| `createMockSignUpWithOrgPayload()` | `SignUpWithOrgDTO` | Auth integration tests |
| `createMockOrganization()` | Organization DB record | DB-level tests |

### Two Types of Factories

Notice there are **two kinds** of data a factory can produce:

1. **DTO factories** (API payloads) — what you *send* to the API
2. **DB record factories** (database rows) — what goes *directly into the DB*

```typescript
// DTO factory — for API requests
const payload = createMockMemberCreationPayload({ role: "admin" });
const res = await client.orgs.members.create(orgId, payload);

// DB record factory — for direct DB setup (test helpers)
const record = createMockMember({ organizationId: orgId, userId: "..." });
await db.insert(memberTable).values(record);
```

### Creating a Factory

```typescript
// tests/factories/project.factory.ts
import type { CreateProjectDTO } from "@shared/schemas/dto/project.dto";

export function createMockProjectPayload(
    overrides: Partial<CreateProjectDTO> = {}
): CreateProjectDTO {
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    return {
        name: `Test Project ${id}`,
        description: "A test project",
        ...overrides,
    };
}
```

**Key rules:**
- Always use unique identifiers (timestamp + random) to avoid conflicts
- Accept `Partial<T>` overrides for flexibility
- Type the return value to enforce schema compliance

## Writing an Integration Test

Here's the anatomy of a well-structured integration test:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { parseJson, type ErrorResponse } from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";

describe("Member Creation", () => {
    let client: TestClient;
    let orgId: string;

    // 1. Fresh DB + authenticated session for every test
    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    // 2. Happy path
    it("should create a member", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(201);
        const body = await res.json() as CreateMemberResponseDTO;
        expect(body.user.email).toBe(payload.email);
    });

    // 3. Error paths
    it("should return 403 for unauthorized users", async () => {
        const unauthClient = createTestClient(app, env);
        const payload = createMockMemberCreationPayload();
        const res = await unauthClient.orgs.members.create(orgId, payload);

        expect(res.status).toBe(401);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
    });
});
```

### Conventions

1. **`beforeEach` always calls `createTestDb()`** — every test gets a fresh database
2. **Create the client in `beforeEach`** — set up auth once, use everywhere
3. **Use `parseJson<T>(res)` for typed responses** — keeps assertions type-safe
4. **Test happy path and error paths** — assert both status codes and response bodies
5. **Use factories for payloads** — never hardcode object literals in tests

## Internal Mechanics

### The Runtime (`workerd`)

Tests do **not** run in Node.js. They run in `workerd`, Cloudflare's local runtime.

- `vitest.config.ts` configures this integration
- `cloudflare:test` is a special runtime module providing `env` and `applyD1Migrations`

### Database Isolation

Each test gets a **fresh, ephemeral D1 database** in memory:

- **Resets** at the end of each `it` block
- **No shared state** between tests
- **No cost** — tests use a local simulated D1, not production/staging

This is why `createTestDb()` must be called in `beforeEach` — it applies migrations to the fresh database.

### Vitest Configuration

```typescript
// vitest.config.ts (key sections)
poolOptions: {
  workers: {
    wrangler: { configPath: "./wrangler.jsonc" },
    miniflare: {
      d1Databases: ["DB"],
      bindings: {
        RESEND_API_KEY: "re_mock_key",
        BETTER_AUTH_URL: "http://localhost:3000",
        BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      }
    },
  },
}
```

- Uses `wrangler.jsonc` for Worker configuration
- Miniflare provides isolated D1 database instances
- Mock bindings for secrets and API keys
- Path aliases (`@api`, `@shared`) match the application

## Testing in CI

Tests run in the **Build Environment** during CI/CD:

```bash
npm install && npm test && npm run build:web
```

- Tests verify code inside a simulated `workerd` environment *before* deployment
- Tests are **always ephemeral** — they never connect to live databases
- If tests fail, the build is aborted and deployment does not proceed
