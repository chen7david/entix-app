# API unit tests (local mocks)

Repository and service unit tests that use `createTestDb()` mocks.

**Note:** These are **not** included in `npm run test:api` today (vitest `include` only covers `tests/**`). They are helpers for integration tests under `tests/integration/` and a future consolidation into `tests/api/`.

To enable in CI, fix mock return values in `helpers/test-db.helper.ts` then add `api/tests/**/*.test.ts` to `tooling/vitest.config.ts` `include`.
