# Testing

This project uses [Vitest](https://vitest.dev) with [@cloudflare/vitest-pool-workers](https://github.com/cloudflare/workers-sdk/tree/main/packages/vitest-pool-workers) for testing.
This configuration allows running tests inside the Cloudflare Workers runtime (`workerd`), ensuring behavior matches production.

## Prerequisites

- Install dependencies: `npm install`
- Generate types: `npm run cf-typegen` or `wrangler types`

## Running Tests

Run all tests:

```bash
npm test
```

## Infrastructure

- **Runner**: Vitest + Miniflare (Workerd)
- **Database**: Each test gets an **isolated** D1 database instance.
- **Migrations**: Migrations from `api/db/migrations` are automatically applied to the test database helper `createTestDb`.

## Writing Tests

Use the `createTestDb` helper from `tests/utils.ts` to get a database instance with schema and migrations applied.

```typescript
import { createTestDb } from "./utils";
import { user } from "../api/db/schema.db";

it("should work", async () => {
    const db = await createTestDb();
    await db.insert(user).values({ ... });
});
```
