# Bulk Import + Billing Guardrails Plan

## Requested Changes (Consolidated)

1. Add a pre-import review/edit step before final bulk import submit.
2. In that review step, allow choosing a default billing plan for the batch.
3. Block bulk import submission when the organization has zero billing plans.
4. Auto-initialize wallets for imported/linked users during import.
5. Show a dashboard warning banner when billing plans count is zero.

## Schema Feasibility Evidence

All requested features are implementable with the current schema (no migrations required):

- Default billing plan assignment -> `finance_billing_plans`, `finance_member_billing_plans` (exists)
- Block import if 0 billing plans -> `finance_billing_plans` (count query)
- Auto-initialize wallets -> `financial_accounts`, `financial_org_settings` (exists)
- Dashboard billing plan count warning -> `finance_billing_plans` (read-only query)
- Per-row import result summary -> response DTO only (in-memory)

## Scope Classification (UI vs Backend/DB)

- `Pre-import review/edit step` -> UI + API contract update
- `Default billing plan selector` -> UI + backend assignment logic
- `Block import when no billing plan` -> UI guard + backend validation guard
- `Auto-initialize wallets on import` -> backend service logic (no schema change expected)
- `Dashboard warning banner (0 billing plans)` -> UI + read endpoint usage

### Are these pure UI changes?

No. This is not pure UI.

Expected split:
- UI work: review step, selector, disable/guard states, banners, CTA links.
- Backend work: import payload/options handling, wallet provisioning during import, billing plan assignment during import, server-side validation to prevent bypass.
- DB migration: not required for this feature set.

## Implementation Plan

## Phase 1 - Product Rules and Validation

1. Define import policy:
   - Require default billing plan for bulk import.
   - Wallet initialization runs only for newly created/linked members.
   - Wallet initialization is enforced ON for newly created/linked members (not toggleable).
   - Add explicit conflict behavior for existing plans:
     - `billingPlanConflict: "replace" | "skip"`
   - Default `billingPlanConflict` to `"replace"` (UI preselected).
   - Define `"skip"` semantics explicitly:
     - skip billing plan assignment step only
     - continue user/member import and wallet initialization for that row
2. Define partial-failure behavior:
   - Import continues per row.
   - Per-row errors returned (identity conflict, wallet init error, billing assign error).
   - Summary includes created/linked/walletInitialized/billingAssigned/failed.

## Phase 2 - Backend Changes

1. Add idempotent wallet provisioning method (first-class prerequisite):
   - `provisionWalletIfNotExists(userId, orgId)` in financial service layer.
   - Read currencies from `financial_org_settings.auto_provision_currencies`.
   - If org settings row is missing, fallback to default currencies:
     - `["fcur_etd", "fcur_cny"]`
   - Create missing wallets only; do not throw on existing wallets.
2. Extend bulk import request DTO (or route input) with import options:
   - `defaultBillingPlanId: string` (required once policy is enabled)
   - `billingPlanConflict: "replace" | "skip"` (required; no implicit overwrite behavior)
   - remove `initializeWallets` option (wallet init enforced by policy)
3. Add upfront guards before row processing (fail fast):
   - Validate `defaultBillingPlanId` exists, belongs to org, and is active.
4. Update `MemberImportService`:
   - Inject needed services:
     - user wallet provisioning (idempotent behavior)
     - billing plan assignment service
   - After user/member creation/linking succeeds:
     - initialize wallets (enforced for newly created/linked members)
     - assign default billing plan
5. Keep operations idempotent:
   - Wallet init should skip existing wallets without failing import.
   - Billing assignment should replace/skip according to `billingPlanConflict`.
6. Extend import response summary:
   - Include `walletInitialized` and `billingAssigned` counters.
7. Update `BulkMemberHandler.importMembers` to pass import options to `MemberImportService`.

### Backend Implementation Notes (Schema-Driven)

1. `finance_member_billing_plans` uniqueness (`user_id`, `organization_id`, `currency_id`) plus existing `upsertMemberPlan` behavior means assignment is naturally idempotent and replacement-capable.
2. Wallet provisioning must read currency set from `financial_org_settings.auto_provision_currencies` (JSON array), not hardcode currencies.
3. `financial_accounts` uniqueness protects data integrity, but service logic should avoid conflict-driven control flow. Add an idempotent wallet provision method (existence-check/upsert pattern) in financial service layer.
4. `MemberImportService` currently injects only user/member/profile/social repositories; implement required service injections for:
   - billing plan assignment
   - wallet provisioning

## Phase 3 - UI Changes (Bulk Import Flow)

1. Add a review page/modal step before final submit:
   - Show parsed row count + pre-validation summary.
   - Show settings section:
     - default billing plan select
     - billing conflict behavior selector (`replace` or `skip`)
   - Default control states:
     - billing plan selector: no default (explicit user selection required)
     - conflict selector: default to `replace`
2. Fetch billing plans for org:
   - If zero plans:
     - show blocking message
     - disable final import action
     - show CTA to create billing plan
3. Submit import with selected options to backend.
4. Show import result summary with granular outcomes.

## Phase 4 - Dashboard Warning

1. On org dashboard, fetch billing plan count (or reuse existing plans query).
2. If count is zero:
   - render warning banner at top area
   - include CTA button to billing plan creation page
3. Keep banner visible until at least one billing plan exists.

## Phase 5 - Testing

1. Backend tests:
   - import blocked when no plans
   - import fails for invalid/default plan from other org
   - `billingPlanConflict: "replace"` overwrites existing member plan
   - `billingPlanConflict: "skip"` preserves existing member plan
   - wallet already exists -> import row succeeds (idempotent wallet path)
   - `auto_provision_currencies` with multiple currencies provisions each missing wallet
   - wallet init called for successful rows
   - billing plan assignment applied for successful rows
   - result summary counts (`walletInitialized`, `billingAssigned`, `failed`) accurate on partial failure
2. UI tests:
   - review step requires selecting plan
   - review step requires choosing billing conflict behavior
   - import button disabled at zero plans
   - dashboard banner appears/disappears based on plan count
3. E2E:
   - successful import with wallet + billing assignment
   - blocked flow with zero plans and CTA path

## Risks / Decisions to Confirm

1. None open. Decisions locked:
   - `billingPlanConflict` default: `replace`
   - wallet initialization: enforced ON for newly linked/created members

## Rough Effort

- Backend: medium (service wiring + validation + idempotency handling)
- UI: medium (review step + guards + dashboard banner)
- QA/tests: medium

Estimated total: 1-2 days of focused implementation including tests.
