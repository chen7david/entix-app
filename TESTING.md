# Testing

This project uses [Vitest](https://vitest.dev) with [@cloudflare/vitest-pool-workers](https://github.com/cloudflare/workers-sdk/tree/main/packages/vitest-pool-workers).
Tests run inside the Cloudflare Workers runtime (`workerd`), ensuring behavior matches production.

## 1. Prerequisites

- Install dependencies: `npm install`
- Generate types: `npm run cf-typegen` or `wrangler types`

## 2. Running Tests

Run all tests:

```bash
npm test
```

## 3. Internal Mechanics & Architecture

### The Runtime (`workerd`)
Your tests do **not** run in Node.js. They run in `workerd`, Cloudflare's local runtime. 
- `vitest.config.ts` configures this integration.
- `cloudflare:test` is a special runtime module injected by the runner to provide helpers like `env` and `applyD1Migrations`.

### Database Isolation & Lifecycle
By default, **Storage is Isolated**.
- **Ephemeral**: Each test gets a fresh, empty D1 database instance in memory.
- **Resets**: At the end of each test (`it` block), the database is wiped. 
- **Consequence**: You cannot share state between tests (e.g., Test A inserts, Test B reads).

### Billing & Costs
- **No D1 Costs**: Tests use a local simulated D1. They do **not** connect to your production/staging D1, so they use no row reads/writes.
- **CI Costs**: If running in Cloudflare Workers Builds, you consume **build minutes**.

## 4. Project Structure
We organize tests by type to keep the suite manageable:

- `tests/integration/`: Full stack tests (API -> DB).
- `tests/unit/`: Isolated logic tests (Helpers, Utilities).
- `tests/factories/`: Data generation helpers (e.g., `user.factory.ts`).
- `tests/lib/`: Test infrastructure (setup, env types).

## 5. Writing Tests

### Strict Typing & Best Practices
1.  **No `any`**: Avoid `any` or `unknown`. Cast API responses to known Drizzle schemas or Zod types.
    ```typescript
    const users = (await res.json()) as User[]; // Good
    ```
2.  **Use Factories**: Never manually create object literals for DB inserts. Use factories in `tests/factories/` to ensure schema compliance.
3.  **Setup Per Test**: Use `createTestDb()` in `beforeEach` to respect isolation.

### Example

```typescript
import { createTestDb, TestDb } from "../lib/utils";
import { createMockUser } from "../factories/user.factory";

describe("User API", () => {
    let db: TestDb;
    beforeEach(async () => { db = await createTestDb(); });

    it("should return users", async () => {
        // 1. Setup
        await db.insert(user).values(createMockUser());
        
        // 2. Act
        const res = await app.request("/users", {}, env);
        
        // 3. Assert (Strictly Typed)
        const body = (await res.json()) as User[]; 
        expect(body).toHaveLength(1);
    });
});
```
