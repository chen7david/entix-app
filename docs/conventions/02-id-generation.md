<!-- AI_CONTEXT -->
<!-- LAST_UPDATED: 2026-04-19 -->
<!-- Canonical rules for generating primary keys and stable prefixed IDs. -->

# ID generation

All **random ID shapes** (prefix + nanoid length, opaque PK, secrets) are defined in **`shared/lib/id.ts`** and re-exported from **`@shared`**. Do **not** call `nanoid()` outside that module.

**Where the file lives:** keep **`shared/lib/id.ts`** inside the **`shared`** package (never under `api/`). That keeps **web**, **api**, and future **Turborepo** apps depending on one direction: **apps → `@shared`**. `shared` must **not** import from `api/`.

Schema files **import** from **`../../lib/id`** (relative to `shared/db/schema/*.ts`) when attaching `$defaultFn` to a column.

---

## Current schema defaults (this repo)

These tables omit `id` on simple inserts; Drizzle fills it via **`shared/lib/id.ts`**:

| Table / column | Helper | Notes |
|----------------|--------|--------|
| `auth_members.id` | `generateOpaqueId` | `MemberRepository.insert` omits `id`. **`prepareInsertQuery(id, …)`** still passes `id` for registration / bulk import batches. |
| `financial_org_settings.id` | `generateOpaqueId` | `insertDefaults(organizationId)` only. |
| `scheduled_sessions.id` | `generateOpaqueId` | `SessionScheduleService` omits session `id`; **`seriesId`** for recurrence is still minted in the service (shared across rows). |
| `media.id` | `generateMediaId` | Same as opaque; Drizzle default on insert. |

No SQL migration is required: defaults are applied by Drizzle at insert time.

---

## Is “everything in the schema layer” a good idea?

**No — not as a universal rule.**

| Approach | When it works | When it fails |
|----------|----------------|----------------|
| **Service generates `id` before insert** | `db.batch()`, `prepareInsert`, any insert where another row or audit line references the same id in one transaction, signup flows, ledger writes | Slightly more boilerplate on simple single-row inserts |
| **Schema `$defaultFn(() => …)` only** | Simple single-table inserts where **nothing** in the same transaction needs the id before the statement runs | Batched mutations, id returned to client without `.returning()`, linking child rows, idempotency keys tied to a pre-assigned id |

**Recommended pattern (hybrid):**

1. **Canonical functions** always live in **`shared/lib/id.ts`** (one implementation of entropy and prefixes).
2. **Services** import from `@shared` and **assign ids explicitly** whenever you need the value **before** `execute`/`batch` (this matches **API.md** batch and “service owns orchestration” intent).
3. **Optional** **`$defaultFn` in Drizzle schema** may call the **same** helpers (e.g. `generateMediaId`) **only** for tables where inserts are always single-step and the id is not read until after insert. Treat each table as a conscious opt-in.

Rolling “all defaults into schema only” would **fight** registration, ledger batches, payment queue preparation, and any `prepareInsert` pipeline—you would still re-introduce service-side minting for those paths, ending up with **two conventions** and more confusion.

---

## Why one module

- One place controls entropy length and string shape (`prefix_nanoid`).
- Refactors (prefix or length policy) happen once.
- Repositories stay dumb: they never import `nanoid`; services (or schema defaults that delegate to `id.ts`) supply values.

---

## API (`shared/lib/id.ts`)

| Helper | Format | Typical use |
|--------|--------|-------------|
| `generateId(prefix)` | `{prefix}_{21-char nanoid}` | Rarely call directly; prefer typed helpers below. |
| `generateOpaqueId()` | 21-char nanoid, no prefix | Users, orgs, members, sessions, org settings, etc. |
| `generateSecretToken()` | 32-char nanoid | Dummy passwords, non-row secrets (not a PK). |
| `generateShortUpperToken(n?)` | Short uppercase string | Test-style codes (e.g. auth `xid`). |
| `generateAccountId()` | `facc_…` | Financial accounts |
| `generateCurrencyId()` | `fcur_…` | Currencies |
| `generateCategoryId()` | `fcat_…` | Transaction categories |
| `generateTransactionId()` | `tx_…` | `financial_transactions.id` |
| `generateTransactionLineId()` | `txl_…` | `financial_transaction_lines.id` |
| `generatePaymentRequestId()` | `pr_…` | Payment queue rows |
| `generateAuditId()` | `aud_…` | System audit events |
| `generateBillingPlanId()` | `fbp_…` | Billing plans |
| `generateBillingPlanRateId()` | `fbpr_…` | Plan rates |
| `generateMemberBillingPlanId()` | `fmbp_…` | Member plan assignments |
| `generateMediaId()` | Same as `generateOpaqueId` | `media.id` Drizzle default (optional pattern) |

---

## Drizzle schema defaults

Allowed **only** when the row does not participate in a same-transaction graph that needs the id earlier:

- Import from **`../../lib/id`** relative to `shared/db/schema/*.ts` (see `media.schema.ts`, `organization.schema.ts`, `financial-org-settings.schema.ts`, `schedule.schema.ts`).
- The default must call a **named helper** from `id.ts`, not inline `nanoid`.

If a new table might later gain batch inserts or FK siblings in one batch, **do not** rely on schema default alone—mint in the service.

---

## Tests

Factories and integration tests should import the same helpers as production code (`generateOpaqueId`, `generateAccountId`, …).

Fixed string IDs (for example `pr_test001`, `facc_ghost`) are fine when the test asserts on a **known** value, idempotency, or stable joins. Prefer helpers when the test only needs **shape** or uniqueness (for example `expect(id).toMatch(/^pr_/)` after a real insert).

---

## Financial IDs: production consistency

**Application code** that mints new financial primary keys should use **`@shared`** helpers only (`generateTransactionId`, `generateTransactionLineId`, `generatePaymentRequestId`, `generateAccountId`, `generateAuditId`, …). Grep the repo under `api/` for `generateTransactionId` / `generatePaymentRequestId` etc. to confirm call sites.

You will still see **literal** `facc_…`, `fcur_…`, `fcat_…`, `tx_…` strings in three intentional cases:

1. **Seeded or catalog data** — stable rows loaded from seeds or constants (for example known category slugs like `fcat_cash_deposit`, seeded currency `fcur_usd`).
2. **Deterministic synthetic accounts** — functions such as `getTreasuryAccountId(currencyId)` in `shared/constants/financial.ts` build predictable IDs from another key; they are **not** random nanoids and must **not** use `generateAccountId()`.
3. **Tests** — fixed IDs for assertions (see above).

If you add a **new** random financial PK in a service, add a typed helper in `shared/lib/id.ts` (or reuse `generateId('yourprefix')` if the domain is narrow) and import it from `@shared`.

### Branded / nominal types per entity (`type AccountId = …`)

**Optional.** TypeScript nominal branding (`string & { __brand: 'AccountId' }`) does not change runtime or DB behavior; it only catches accidental string swaps at compile time. Drizzle and most row types use `string` today, so adopting brands everywhere means casts at DB boundaries or a large type refactor. Reasonable compromise: keep plain `string` in persistence types; if a boundary needs safety (for example a public API DTO), narrow there only.

---

## Optional `id` on insert vs `prepare*` batch APIs

After removing `id` from some repository “simple insert” signatures, two patterns remain:

| Pattern | Use when |
|---------|----------|
| **Omit `id`; schema `$defaultFn` or DB default** | Single-row insert; nothing else in the transaction needs that PK before execute. |
| **Explicit `id` in values** (or **`prepareInsertQuery(id, …)`**) | Registration, import pipelines, `db.batch()`, any child row or external reference that must use the **same** id before insert. |

**Recommendation:** keep **named** batch entry points (`prepareInsertQuery`, …) rather than a generic `insert({ …, id?: string })` on every repository. That makes “this path assigns ids for orchestration” obvious at the call site and avoids optional-field ambiguity (was `id` omitted on purpose or forgotten?). If a specific service grows many optional overrides, a small **`options` object** scoped to that service (for example `{ memberId?: string }` for tests) is preferable to a repo-wide generic.

---

## Should other tables get opaque `$defaultFn`?

**Only when the same criteria as above hold:** single-step inserts, no same-transaction sibling that needs the PK beforehand, and you are happy relying on `.returning()` or no client-visible id until after insert. Do **not** blanket-add defaults to every table—each opt-in should be documented in the “Current schema defaults” table in this file.

---

## Is the hybrid approach a “code smell”?

**Not if naming is consistent.** A smell would be **undocumented** mixing (sometimes random in service, sometimes raw `nanoid` in a random file, sometimes wrong prefix). This repo standardizes on:

- **One module** for entropy and prefixes (`shared/lib/id.ts`).
- **Explicit minting** where the graph needs the id early; **schema default** where it does not.
- **Named** batch APIs where ids are injected intentionally.

When adding a repository, pick one primary insert path and document the exception (batch / explicit id) in the repository JSDoc, matching **API.md** / **architecture/03-repository-service.md**.

---

*Last updated: 2026-04-19*
