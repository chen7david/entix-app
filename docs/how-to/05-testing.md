<!-- AI_CONTEXT -->
<!-- This document explains the project's testing philosophy and how to run tests. -->

# Testing Guide

We maintain high confidence in our codebase through a tiered testing strategy: Unit tests for business logic and Integration tests for the full request lifecycle.

## 1. Unit Tests (Vitest)

Unit tests are used to verify isolated logic in **Services** or **Utility functions**. They are fast and do not require a database.

### Philosophy
- **Services**: Mock the repositories and external clients using `vi.fn()`.
- **Utils**: Test pure functions with a variety of inputs.

### Example: Mocking a Repository
```typescript
// tests/unit/playlist.service.test.ts
import { PlaylistService } from "@api/services/playlist.service";

describe("PlaylistService", () => {
    it("should throw NotFoundError if playlist is missing", async () => {
        const mockRepo = { findPlaylistById: vi.fn().mockResolvedValue(null) };
        const service = new PlaylistService(mockRepo as any);
        
        await expect(service.getPlaylist("id_123", "org_123")).rejects.toThrow();
    });
});
```

### Running Unit Tests
```bash
# Run a specific unit test
npx vitest tests/unit/playlist.service.test.ts

# Run all unit tests
npm run test:unit
```

## 2. Integration Tests

Integration tests verify the full stack: Hono Handlers -> Services -> Repositories -> D1 Database. These run inside a **Cloudflare Workers (Miniflare)** environment.

### DB Isolation
Each test file runs against a clean, migrated local D1 instance to ensure side effects don't leak between tests.

### Running Integration Tests
```bash
# Run a specific integration test
npx vitest tests/integration/orgs/playlist.integration.test.ts

# Run all integration tests
npm run test:api
```

## 3. Mocking External Bindings (`vitest.config.ts`)

Integration tests run in an isolated environment. Any environment variables or service bindings (R2, KV) defined in `wrangler.jsonc` must have a mock value in `vitest.config.ts`.

> [!WARNING]
> **New Env Vars**: If you add a mandatory environment variable to the API, you **must** add a mock value to the `miniflare.bindings` section in `vitest.config.ts`. Failure to do so will cause all integration tests to fail with a `500` error as the app fails to boot.

## 4. Test Summary Commands

| Command | Description |
| :--- | :--- |
| `npm run test` | Runs the full suite (Unit + Integration). |
| `npm run test:api` | Runs all API integration tests. |
| `npm run test:unit` | Runs all unit tests. |
| `npm run typecheck:api` | Verifies TypeScript integrity of the API and tests. |

---
Last updated: 2026-03-30
