# Onboarding State Enforcement Assessment Report

## Executive Summary

This report documents an onboarding/security design problem in `entix-app`, the solution options considered, tradeoffs, and the recommended implementation.

The core requirement is:

- A newly created user verifies email.
- The user is auto-signed in.
- The user must set a password before accessing normal app features.
- This requirement must not be bypassable.

The final conclusion is:

- This is not only a UX flow; it is an authorization policy.
- Frontend-only gating is insufficient and bypassable.
- Backend state enforcement is required.
- Performance concerns should be addressed by reducing duplicate session lookups and (optionally) adding cautious caching.

---

## 1) Problem Statement

### Business Goal

Enable a smooth first-time onboarding flow:

1. User receives verification email.
2. User clicks verification link.
3. User is automatically logged in.
4. User is redirected to set password.
5. User cannot access protected account features until password is set.

### Technical Constraint

Current backend already authenticates users with Better Auth. The new requirement introduces a second dimension:

- Not just “authenticated vs unauthenticated”
- Also “onboarding complete vs incomplete”

Without explicit backend enforcement, a verified/authenticated user can call protected APIs directly (Postman/curl/devtools), bypassing frontend route guards.

---

## 2) Why Frontend-Only Checks Are Not Sufficient

Frontend checks alone are insecure for this requirement because:

- API calls can be made outside the browser UI.
- SPA route redirects do not protect backend endpoints.
- Email verification and onboarding completion are different states.
- Future clients (mobile/scripts/integrations) may not apply the same UI logic.

Result: frontend-only checks violate the requirement “cannot bypass.”

---

## 3) Chosen Domain Model: `userState`

A state-machine approach was adopted for flexibility and clarity.

## States

- `UNCONFIRMED`: user exists, email not verified
- `FORCE_PASSWORD_CHANGE`: email verified, signed in, password setup required
- `ACTIVE`: onboarding complete, full access
- `SUSPENDED`: blocked by admin policy

## Core Transitions

- `UNCONFIRMED -> FORCE_PASSWORD_CHANGE` on email verification
- `FORCE_PASSWORD_CHANGE -> ACTIVE` after successful password reset/set

This model is extensible for future states (`PENDING_MFA_SETUP`, `DEACTIVATED`, etc.) without schema redesign.

---

## 4) Options Evaluated

## Option A: Frontend-only onboarding gate

### Description
- Store onboarding state and redirect user to `/set-password` in UI only.

### Strengths
- Simple implementation.
- No extra backend middleware.

### Weaknesses
- Bypassable via direct API calls.
- Fails security requirement.
- Inconsistent across non-web clients.

### Verdict
- Rejected for this project’s requirement.

---

## Option B: Backend enforcement on protected routes (implemented)

### Description
- Add `userState` to auth user model.
- Enforce `ACTIVE` on protected route groups (`/api/v1/orgs/*`, `/api/v1/users/*`).
- Keep auth routes (`/api/v1/auth/*`) accessible for onboarding actions.

### Strengths
- Enforces policy server-side.
- Non-bypassable by client manipulation.
- Scales to multiple clients.

### Weaknesses
- Adds per-request state check on protected routes.
- Requires updates to tests/fixtures after introducing new required state field.

### Verdict
- Accepted and implemented.

---

## Option C: Separate `/complete-onboarding` endpoint after password reset

### Description
- Client calls reset-password, then calls complete-onboarding to set `ACTIVE`.

### Strengths
- Explicit ownership of state transition in app code.

### Weaknesses
- Two-step client workflow can partially fail (network drop between calls).
- Can leave user in inconsistent state (`password set` but still `FORCE_PASSWORD_CHANGE`).

### Verdict
- Rejected as primary approach due to partial-failure window.

---

## Option D: Promote to `ACTIVE` inside `onPasswordReset` hook (implemented)

### Description
- Better Auth handles password update.
- In `onPasswordReset`, update `userState` to `ACTIVE`.

### Strengths
- Removes client-coordination dependency.
- Keeps transition server-side and idempotent.
- Works for current onboarding path (reset-token based first password set).

### Weaknesses
- Sequential in one request, not guaranteed single DB transaction.
- Hook semantics are tied to reset-password flow design.

### Verdict
- Accepted for current architecture.

---

## Option E: KV cache for auth state/permissions

### Description
- Cache session/auth snapshot in KV to reduce DB reads.

### Strengths
- Lower DB load.
- Faster repeated auth checks.

### Weaknesses
- Invalidation complexity.
- Stale authorization risk if role/state changes are not synchronized.
- Operational complexity and debugging overhead.

### Security Risks
- Stale `ACTIVE`/role data may grant excess access.
- Incomplete invalidation can delay suspension/revocation.

### Verdict
- Optional optimization only; DB remains source of truth.
- Must include strict invalidation/versioning if adopted.

---

## 5) Implemented Changes (Current Status)

The following was implemented across Phases 1–3:

- Added `shared/constants/user-states.ts`
- Added `userState` column to `auth_users` schema with default `UNCONFIRMED`
- Generated + applied migration locally (`0004_living_professor_monster.sql`)
- Added `userState` to auth DTO validation
- Added Better Auth additional field registration for `userState`
- Added guarded transition in `databaseHooks.user.update`:
  - `emailVerified === true` and state is `UNCONFIRMED`/`null` -> `FORCE_PASSWORD_CHANGE`
- Updated verification link callback to `/set-password`
- Updated `onPasswordReset`:
  - promote non-suspended users to `ACTIVE`
  - keep suspended users from state promotion
- Added `requireUserState` middleware
- Mounted `requireUserState([ACTIVE])` after `requireAuth` on protected route groups
- Updated test helpers/factories to align with new state model

---

## 6) Security Assessment

## Security controls gained

- Server-side authorization gate based on onboarding state.
- Prevents incomplete-onboarding users from protected business endpoints.
- Distinguishes authentication status from business authorization state.

## Residual risks

- `onPasswordReset` and hash write are sequential, not provably one transaction.
- If process fails between steps, user may need retry flow.
- Auth route behavior for suspended users depends on hook behavior and policy choices.

## Risk level

- Overall: acceptable for current architecture.
- Recommended to document behavior explicitly for support/security review.

---

## 7) Performance Assessment

## Current behavior

- Protected routes run auth middleware and user-state middleware.
- If both call `getSession`, this can double session lookups per request.

## Recommended immediate optimization

- Save session once in `requireAuth` context (`ctx.set("session", session)`).
- Reuse that in `requireUserState` (`ctx.get("session")`).

This keeps backend enforcement while reducing redundant lookups.

## Optional advanced optimization

- Introduce short-lived KV cache for auth snapshot with:
  - strict invalidation on logout/password reset/role changes/state changes
  - versioning (`authVersion`/`permissionsVersion`) to prevent stale grants
  - fail-closed fallback to DB

---

## 8) Testing & Validation Status

Phases 1–3 were validated with:

- `npm run typecheck`
- `npm run check:fix`
- `npm run check`
- `npm run test:api`
- `npm run build:web`

All required gates were passed after iterative fixes.

---

## 9) Recommended Next Steps

1. Complete Phase 4 UI flow polish:
   - Ensure verify-email redirect to `/set-password` is clear and consistent.
   - Handle already-active edge case gracefully.
2. Optional Phase 3.1 performance patch:
   - Reuse session from context to avoid duplicate `getSession()` on request.
3. Add focused onboarding integration tests:
   - `UNCONFIRMED -> FORCE_PASSWORD_CHANGE -> ACTIVE`
   - forced-state user blocked on protected APIs
   - suspended-user behavior in reset path
4. If scaling pressure increases, design KV caching with versioned invalidation.

---

## Final Recommendation

Keep backend `userState` enforcement as a mandatory authorization layer, and optimize performance by reusing request context session (and optionally carefully designed cache later). This provides the required non-bypassable onboarding control while keeping database load manageable.
