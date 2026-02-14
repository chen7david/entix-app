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

## Project Structure

We organize tests by type to keep the suite manageable:

- **`tests/integration/`** - Full stack tests (API → DB).
- **`tests/unit/`** - Isolated logic tests (Helpers, Utilities).
- **`tests/factories/`** - Data generation helpers (e.g., `user.factory.ts`).
- **`tests/lib/`** - Test infrastructure (setup, env types).
- **`tests/mocks/`** - Mock implementations.

## Test Factories

Test factories provide a consistent way to generate test data that conforms to your schemas.

### Why Use Factories?

1. **Type Safety**: Factories ensure generated data matches your Drizzle schemas and Zod DTOs
2. **Consistency**: All tests use the same data generation patterns
3. **Maintainability**: When schemas change, update factories in one place
4. **DRY Principle**: Avoid duplicating object creation logic across tests

### Available Factories

Located in `tests/factories/`:

- **`user.factory.ts`** - Creates mock user data for authentication and user-related tests

### Creating a New Factory

```typescript
// tests/factories/example.factory.ts
import { insertExampleSchema } from '@api/db/schema.db';
import type { z } from 'zod';

export const createMockExample = (
  overrides?: Partial<z.infer<typeof insertExampleSchema>>
): z.infer<typeof insertExampleSchema> => {
  return {
    id: crypto.randomUUID(),
    name: 'Example Name',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};
```

### Using Factories in Tests

```typescript
import { createMockUser } from '../factories/user.factory';
import { user } from '@api/db/schema.db';

it('should create a user', async () => {
  // Create test data using factory
  const mockUser = createMockUser({
    email: 'test@example.com' // Override specific fields
  });
  
  // Insert into test DB
  await db.insert(user).values(mockUser);
  
  // Test your logic
  const result = await someFunction();
  expect(result).toBeDefined();
});
```

## Vitest Configuration

The `vitest.config.ts` file configures testing for Cloudflare Workers:

### Cloudflare Workers Pool

```typescript
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

**Key Points**:
- Uses `wrangler.jsonc` for Worker configuration
- Miniflare provides isolated D1 database instances
- Mock bindings for environment variables (secrets, API keys)
- Each test gets a fresh environment

### Path Aliases

Tests use the same path aliases as the application:

```typescript
alias: {
  "@api": resolve(__dirname, "./api"),
  "@shared": resolve(__dirname, "./shared"),
  "@web": resolve(__dirname, "./web"),
}
```

This allows you to import using clean paths:
```typescript
import { user } from '@api/db/schema.db';
import { UserDTO } from '@shared';
```

## Writing Tests

### Strict Typing & Best Practices

1.  **No `any`**: Avoid `any` or `unknown`. Cast API responses to known Drizzle schemas or Zod types.
    ```typescript
    const users = (await res.json()) as User[]; // Good
    ```
2.  **Use Factories**: Never manually create object literals for DB inserts. Use factories in `tests/factories/` to ensure schema compliance.
3.  **Setup Per Test**: Use `createTestDb()` in `beforeEach` to respect isolation.

### Example Test

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

## Testing in CI

### Build Environment

Tests run in the **Build Environment** during CI/CD:
- They verify your code inside a simulated Cloudflare Worker environment (`workerd`) *before* deployment
- **Tests are ALWAYS ephemeral**, even when deploying to Staging
- They **NEVER** connect to your live databases (`entix-app-staging` or `entix-app-production`)
- They use a fresh, empty database created just for the test, which is destroyed immediately after
- This ensures that a bad test cannot wipe or corrupt your staging/production data

### Build Configuration

The build command in Cloudflare Dashboard includes testing:

```bash
npm install && npm test && npm run build:web
```

**Order matters**: Installs dependencies → Runs Tests → Builds Frontend

If tests fail, the build is aborted and deployment does not proceed.
