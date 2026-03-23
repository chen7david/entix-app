# Testing Strategy

How we verify code correctness.

## 1. Unit Tests (Vitest)
Test isolated logic in services or utils. No DB required.
```bash
npx vitest tests/unit/image-url.test.ts
```

## 2. Integration Tests (Cloudflare Test Runner)
Test API handlers, repositories, and real DB interactions.
```bash
npx vitest tests/integration/auth.integration.test.ts
```

## 3. Mocking Dependencies
Use Vitest/Miniflare mocks to simulate external services (e.g., Resend, AWS/R2) and prevent unintended side effects.

### Mocks vs Stubs
- **Mocks**: When you need to assert *how* something was called (e.g., `expect(mockSendEmail).toHaveBeenCalledWith(...)`).
- **Stubs**: When you just need a fake implementation to return a predictable value so the test can proceed.

```typescript
// Example: Stubbing a repository
vi.mock("@api/repositories/member.repository", () => ({
    getMember: vi.fn().mockResolvedValue({ id: "123", role: "admin" })
}));
```

We also actively utilize Factory patterns (`tests/factories/`) to cleanly stub out large mock data payloads without cluttering integration tests.

## 4. Writing Clean Integration Tests
Avoid dropping down to raw HTTP fetch layers when writing integration tests. 

Instead, explicitly build and use domain-specific RPC wrappers inside `tests/lib/test-client/`.

**❌ Bad (Brittle and unreadable HTTP plumbing):**
```typescript
const res = await client.request(`/api/v1/orgs/${orgId}/media?limit=10`, { method: "GET" });
```

**✅ Good (Clean, typed, domain-focused wrappers):**
```typescript
// Expose logical wrappers via tests/lib/test-client/*.client.ts
const res = await client.orgs.media.list(orgId, { limit: 10 });
```

Keeping API interactions securely abstracted ensures that tests focus purely on asserting functional logic and domain payload validity instead of raw networking rules.

## 5. DB Test Isolation
Each test file runs against a clean, migrated local D1 instance.
```bash
npm run test # Runs all tests
```

## 6. Test Environment Bindings (`vitest.config.ts`)

The integration test suite runs inside Miniflare (a local Cloudflare Workers simulator). It does **not** read from `wrangler.jsonc` or `.dev.vars` — it has its own isolated mock environment defined in `vitest.config.ts`:

```typescript
// vitest.config.ts
miniflare: {
  bindings: {
    RESEND_API_KEY: "re_mock_key",
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    FRONTEND_URL: "http://localhost:8000",
    PUBLIC_CDN_URL: "https://mock-cdn.example.com",
    // ...etc
  }
}
```

> [!WARNING]
> **Whenever you add a new required env var** — especially one added to the Zod schema in `api/middleware/env-validator.middleware.ts` — you **must** also add a safe mock value here. If you forget, the app will refuse to boot during tests and every integration test will fail with a `500` error, regardless of whether they use the new variable.

See [How to Add a New Environment Variable](../cloudflare-env-vars-guide.md#how-to-add-a-new-environment-variable) for the full step-by-step checklist.

[Why test in Cloudflare's runtime?](../why/cloudflare-testing.md)

Last updated: 2026-03-14
[Back to Documentation Guide](../how-to-write-docs.md)
