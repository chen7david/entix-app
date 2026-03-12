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
Use Vitest/Miniflare mocks to simulate external services (e.g., Resend).
```typescript
vi.mock("@api/repositories/member.repository");
```

## 4. DB Test Isolation
Each test file runs against a clean, migrated local D1 instance.
```bash
npm run test # Runs all tests
```

[Why test in Cloudflare's runtime?](../why/cloudflare-testing.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
