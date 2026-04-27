# E2E Test Layout

This folder contains Playwright end-to-end tests for full user flows.

## Structure

- `tests/e2e/*.spec.ts`: flow-level tests
- `tests/e2e/helpers/*`: reusable flow helpers (login, setup, navigation)

## Current baseline flows

- `root-admin-login.spec.ts`: verifies that after a DB reset, seeded root admin can log in.
- `root-admin-orchestration.spec.ts`: creates `Entix Academy` + `David Chen`, impersonates,
  activates CNY/ETD wallets, stops impersonation, resends verification, promotes to admin,
  funds CNY and ETD from super-admin billing, then logs out.
- `password-reset-auto-login.spec.ts`: requests password reset, reads reset token from local D1,
  completes reset flow, and verifies post-reset auto-login redirect.

## Run commands

- `npm run test:e2e` - headless
- `npm run test:e2e:headed` - visible browser
- `npm run test:e2e:reset` - reset DB, then headless run
- `npm run test:e2e:reset:headed` - reset DB, then visible run

Use the `:reset` scripts for deterministic runs when tests depend on seed state.
