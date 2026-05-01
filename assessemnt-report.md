# Migration Integrity & Drift Detection Plan

## Ticket Adaptation Notes
- Use Cloudflare/Wrangler-integrated checks, not GitHub Actions workflow files.
- Keep migration checks runnable via npm scripts so they can be enforced in local hooks and Cloudflare CI command steps.
- Lock migration dialect validation to `sqlite` for D1 safety.

## Implementation Checklist
- [x] Create Zod schemas for migration journal and snapshots in `api/db/migrations/schemas.ts`.
- [x] Create policy map engine in `api/db/migrations/policies.ts` that reports all failures.
- [x] Build new runner `scripts/validate-migrations.ts` using schema validation + policy execution.
- [x] Route existing `check:migrations` script entry to the new runner.
- [x] Add Drizzle collision check and dry-run drift check scripts for Cloudflare CI integration.
- [x] Add runtime DB drift check in `api/db/migrations/runtime-check.ts` and invoke it on startup path before serving requests.
- [x] Add independent unit tests for all policies with mock migration contexts.
- [x] Run targeted tests and migration checks, then record outcomes.
- [x] Rename script gate to `check:migrations:all` and enforce it in `.husky/pre-push`.

## Progress Log
- [x] Reviewed current migration setup (`api/db/migrations`, `scripts/check-migration-meta.mjs`, `package.json`) and confirmed Cloudflare-based tooling.
- [x] Added new migration integrity modules (`schemas.ts`, `policies.ts`, `runtime-check.ts`) under `api/db/migrations`.
- [x] Added `scripts/validate-migrations.ts` and switched `npm run check:migrations` to this runner.
- [x] Added Cloudflare CI-friendly gate scripts: `check:migrations:collision`, `check:migrations:drift`, `check:migrations:all`.
- [x] Hooked runtime drift check into app middleware startup path in `api/lib/app.lib.ts`.
- [x] Added policy unit coverage in `tests/unit/migration-policies.test.ts`.
- [x] Added explicit snapshot-on-disk policy and sqlite dialect lock.
- [x] Updated `.husky/pre-push` to run `npm run check:migrations:all`.
- [x] Addressed review fixes:
  - removed duplicate snapshot policy
  - derive snapshot tags from disk files (via snapshot idx mapping)
  - drift script now cleans generated SQL + meta snapshots and restores `_journal.json`
  - runtime check now compares applied migration count to journal count (no hash/tag mismatch warnings)
- [x] Moved seed SQL out of `api/db/migrations` into `api/db/seeds`.
- [x] Updated seed scripts (`db:seed:local`, `db:seed:staging`, `db:seed:production`) and chained local reset to seed.
- [x] Removed seed filter workaround from `scripts/validate-migrations.ts` after seed separation.
- [x] Added `docs/database.md` with one-time seed procedure guidance.
- [x] Verified with:
  - `npm run check:migrations`
  - `npm run check:migrations:collision`
  - `npm run check:migrations:drift`
  - `npm run check:migrations:all`
  - `npx vitest run api/db/migration-guard/__tests__/migration-policies.test.ts`
