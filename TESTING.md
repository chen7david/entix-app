# Testing

This project uses [Vitest](https://vitest.dev) with [@cloudflare/vitest-pool-workers](https://github.com/cloudflare/workers-sdk/tree/main/packages/vitest-pool-workers).
Tests run inside the Cloudflare Workers runtime (`workerd`), ensuring behavior matches production.

## Prerequisites

- Install dependencies: `npm install`
- Generate types: `npm run cf-typegen` or `wrangler types`

## Running Tests

Run all tests:

```bash
npm test
```

## Internal Mechanics & Architecture

### 1. The Runtime (`workerd`)
Your tests do **not** run in Node.js. They run in `workerd`, Cloudflare's local runtime. 
- `vitest.config.ts` configures this integration.
- `cloudflare:test` is a special runtime module injected by the runner to provide helpers like `env` and `applyD1Migrations`.

### 2. Database Isolation & Lifecycle
By default, **Storage is Isolated**.
- **Ephemeral**: Each test gets a fresh, empty D1 database instance in memory.
- **Resets**: At the end of each test (`it` block), the database is wiped. 
- **Consequence**: You cannot share state between tests (e.g., Test A inserts, Test B reads).

### 3. Billing & Costs
- **No D1 Costs**: Tests use a local simulated D1. They do **not** connect to your production/staging D1, so they use no row reads/writes.
- **CI Costs**: If running in Cloudflare Workers Builds, you consume **build minutes**.

## Writing Tests

### Best Practices

1.  **Setup Per Test**: Since storage resets, use `createTestDb()` inside every test (or `beforeEach`) to apply migrations.
2.  **No Shared State**: Treat every test as a self-contained universe.
3.  **Optimization**: For many small test files, enabling `singleWorker: true` in `vitest.config.ts` can improve performance by reducing process overhead.

### Example

```typescript
import { createTestDb } from "./utils";
import { user } from "../api/db/schema.db";

it("should work", async () => {
    // 1. Setup (Migrate)
    const db = await createTestDb();
    
    // 2. Act
    await db.insert(user).values({ ... });
    
    // 3. Assert
    const result = await db.select().from(user);
    expect(result).toHaveLength(1);
});
```
