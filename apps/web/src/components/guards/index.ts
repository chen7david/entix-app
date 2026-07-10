/**
 * Route guard stack (document order — do not duplicate checks across guards):
 *
 * 1. **GuestRoute** — User must **not** be authenticated (sign-in / sign-up / password reset).
 *    Redirects authenticated users away (e.g. back to `state.from` or `/`).
 *
 * 2. **ProtectedRoute** — User must be authenticated (`useAuth`). Optionally:
 *    - `allowedRoles` — platform-wide role (e.g. super-admin routes under `/admin/...`).
 *    - `allowedOrgRoles` — current org role; only valid **after** `OrgGuard` has synced the
 *      active organization session so `user.orgRole` matches the URL slug.
 *
 * 3. **OrgGuard** — For `org/:slug/*`. Resolves the org from the slug, syncs server active org,
 *    exposes **OrgProvider**. If the slug is not in the member’s org list → **403** (no second
 *    “membership” check elsewhere for URL access). Does **not** replace role gates: use nested
 *    **ProtectedRoute** with `allowedOrgRoles` for admin vs teaching trees.
 *
 * Avoid: nesting two org-membership checks, or checking `allowedOrgRoles` without `OrgGuard`
 * above (role may be stale or wrong org).
 */

export { GuestRoute } from "./GuestRoute";
export { OrgGuard } from "./OrgGuard";
export { ProtectedRoute } from "./ProtectedRoute";
