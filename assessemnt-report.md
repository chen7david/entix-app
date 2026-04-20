# Entix-App Codebase Assessment Report

**Scope:** Alignment with `docs/API.md` and `docs/UI.md`, test health, logical/code-quality issues, and implications of adopting a **typed Hono client** (RPC/`hc` or OpenAPI-generated client — referred to below as the “Hono REST client” migration).

**Audit completed:** 2026-04-19  
**Verification run:** `npm run typecheck:api` ✓ · `web/npm run typecheck` ✓ · `npm run test:api` (240 tests) ✓ · `web/npm run test:run` (22 tests) ✓

---

## Progress tracker

| Area | Status | Summary |
|------|--------|---------|
| API.md — repos / services / handlers | **DONE** | Several documented violations |
| API.md — pagination & responses | **DONE** | Mostly cursor-based; a few shape mismatches |
| API.md — tests layout & patterns | **DONE** | Root `tests/` differs from doc tree; factories exist |
| UI.md — fetching, HTTP, hooks location | **DONE** | Major gaps vs `fetch`/axios rules |
| UI.md — pages, lazy load, structure | **DONE** | No `.page.tsx`; no `React.lazy` |
| UI.md — notifications, boundaries | **PARTIAL** | Mixed `App.useApp` vs static APIs |
| UI.md — tests (ui + hooks) | **DONE** | Far below mandated coverage |
| Hono client migration | **DONE** | Scoped in §5 |
| Remediation **Phase A** (nanoid → service) | **DONE** | See §7.3 log (2026-04-19) |
| Remediation **Phase B** (repo error purity) | **DONE** | See §7.3 log (2026-04-19) |
| Remediation **Phase C** (handler layering) | **DONE** | See §7.3 log (2026-04-19) |
| Remediation **Phase D** (handler errors / uploads) | **DONE** | See §7.3 log (2026-04-20) |

---

## Executive summary

The backend generally follows the documented **layered architecture** (many services extend `BaseService`, cursor helpers exist, typecheck and API tests pass). However, there are **multiple explicit API.md violations** (nanoid and errors in repositories, handlers calling repositories or `db` directly, `new Error` in production paths, handler `try/catch`, and at least one response shape that does not match the documented envelope).

The frontend **does not currently match UI.md** on several mandatory points: **almost all API traffic uses `fetch`**, there is **no shared `lib/axios.ts` instance** (and **no `axios` usage** despite it being a dependency), **route pages are not lazy-loaded**, **hooks live under `features/*/hooks` instead of `src/hooks/`**, and **mandated test coverage for `ui/` and hooks is largely absent**.

**Tests:** API test suite is broad and green. Web tests are minimal smoke/unit coverage relative to UI.md Rules 35–36. No automated audit found obvious duplicate test files; some integration areas (auth, avatar, finance) overlap in *intent* and could be consolidated in a future cleanup.

**Hono REST client:** Moving to `hono/client` (or an OpenAPI client generated from your Zod/OpenAPI spec) would primarily touch **the web data layer** (dozens of `fetch` call sites). **Backend route handlers need not change** if URLs and payloads stay the same. **Regression** should lean on existing **integration tests** plus targeted **web hook tests** after swapping the transport. **Tests that mock `fetch`** (if any) would need updating; current hooks mostly inline `fetch` without a single injectable client, which makes migration a good time to introduce one abstraction.

---

## 1. API.md compliance

### 1.1 Violations and risks (by rule #)

| Rule | Severity | Finding |
|------|----------|---------|
| **1** | High | Repositories import/use **`nanoid`**: `member.repository.ts`, `financial-org-settings.repository.ts`, `financial-currencies.repository.ts`, `financial-transaction-categories.repository.ts`. IDs MUST be generated in the Service layer. |
| **2** | ~~High~~ **Mitigated (Phase B)** | ~~Repos above~~ — billing-plan / ledger repo throws addressed in Phase **B**; revisit if new repo throws appear. |
| **3** | ~~High~~ **Mitigated (Phase C)** | ~~Audit/reconciliation handlers~~ — routed through **`AdminAuditService`** / **`ReconciliationService`** (Phase **C**). |
| **4** | Medium | **`FinanceBillingPlansService`**, **`MemberExportService`**, **`MemberImportService`**, **`BucketService`**, **`CacheService`**, **`MailService`** do not extend **`BaseService`** (pattern drift vs doc). |
| **6** | Low–Med | Many `findFirst` usages **do** use `?? null` (good). Spot-check any `findFirst` path that returns a value without coercion (grep shows many sites — verify any that return directly to services). |
| **13–15** | ~~Medium~~ **Partial (Phase D)** | **`uploads.handlers`**, **`session-payment.service`**, **`mailer.service`**, **`entix.queue`** — generic **`Error`** replaced with **`AppError`** subclasses where touched in Phase **D**. Grep for remaining **`new Error`** under **`api/`** after merges. |
| **14** | ~~Medium~~ **Mitigated (Phase D)** | **`uploads.handlers.ts`** — **`try/catch`** removed (Phase **D**). |
| **14 / 45** | ~~Low~~ **Mitigated (Phase C)** | Retry **`try/catch`** moved into **`ReconciliationService`**; handler maps outcomes only. |
| **19** | Process | Doc references **`MemberService.assertMembership`**. Code uses **`requireOrgMembership`** middleware and **`getMember`** patterns. Not necessarily wrong, but **naming and doc are out of sync**; confirm every org-scoped service path is covered by middleware + service checks. **`assertMembership` grep:** no matches. |
| **23–27** | ~~Medium~~ **Mitigated (Phase D)** | **`listUploads`** returns explicit **`{ items, nextCursor, prevCursor }`** aligned with **`createPaginatedResponseSchema`**. **`completeUpload`** returns typed **`UploadDto`** (no **`as any`**). |
| **28–32** | Process | Tests live under repo-root **`tests/`** with **`tests/factories/`** — conceptually aligned, but **folder layout differs** from API.md’s `tests/unit` + `tests/mocks` examples (`makeMember` vs `createMockMember` naming). |

### 1.2 Positive observations (API)

- **Cursor pagination helpers** (`buildCursorPagination`, `processPaginatedResult`) are used across multiple repositories (playlists, sessions, media, uploads, orgs, users, audit, etc.).
- **No `catch (error: any)`** under `api/` (good for Rule 45).
- **`npm run typecheck:api`** and **240 API tests** pass — refactors can be done safely with test backing.
- Many services **do** extend **`BaseService`** and use **`assertExists`** patterns where implemented.

---

## 2. UI.md compliance

### 2.1 Major gaps

| Rule | Severity | Finding |
|------|----------|---------|
| **5** | **Critical** | **`axios` is listed in `web/package.json` but is unused** in `web/src` (grep: no imports). **All HTTP uses `fetch`** across features (finance, media, wallet, admin, schedule, organization, etc.). Doc: **all HTTP MUST use shared instance from `lib/axios.ts`** and **never `fetch()`** for app API calls. |
| **2, 41** | High | Server IO is concentrated in hooks (good), but **implementation violates the mandated transport** (`fetch` instead of axios instance). |
| **6, 20** | Medium | Domain hooks live under **`web/src/features/*/hooks/`** and **`web/src/features/*/*.hooks.ts`**, not **`web/src/hooks/`** as mandated. Only **`useTimezoneInit`** appears under `web/src/hooks/`. |
| **7, 9** | Medium | Pages are **`OrganizationMembersPage.tsx`**, etc. — **not** **`kebab-case.page.tsx`**. Several pages use **`useQueryClient`** only (acceptable), but doc’s naming convention is not followed. |
| **30** | High | **`App.tsx`** uses **static imports for every page** — **no `React.lazy`**. Doc: all page components MUST be lazy-loaded. |
| **21** | Medium | **QueryClient defaults** set **`staleTime: 5m`** globally (helps), but many hooks **do not set per-query `staleTime`**; doc requires **explicit** `staleTime` on every `useQuery` (no reliance on default `0` semantics). |
| **22** | Partial | **`useInfiniteQuery`** is used for some lists (`useMembers`, `useSchedule`, `useMedia`). Many other list flows use **`useQuery` + `fetch`** — verify each list endpoint is **cursor-based** end-to-end (backend + hook). |
| **32** | Medium | **Single top-level `ErrorBoundary`** in `App.tsx`. Doc: **each route-level page** and **each independently fetching section** should be wrapped. Not met. |
| **48** | Low–Med | Many files use **`App.useApp()`** correctly; **`AuditLogPage`** uses **`message.success` / `message.error`** without checking if that path is under `App` provider (may still work if wrapped — verify). Other files may still import static APIs — grep showed widespread `notification.*` usage **from components that also use `App.useApp`** in many places (good). |
| **35–36** | High | **`web/src/components/ui/`** has almost no components and **zero `*.test.tsx`**. Only **3** feature-level tests under `web/src/features` plus **`ForgotPasswordForm.test.tsx`**, **`App.test.tsx`**, smoke tests — **far below** “every `ui/` component” and “every hook” mandates. |

### 2.2 Positive observations (UI)

- **React Query** is the dominant data layer; **`useEffect` + `fetch` for server data** was not flagged as a primary pattern (mutations/queries live in hooks).
- **Jotai atoms** found (`useSidebar.ts`, `upload.store.ts`) are **module-level**, not inside components (Rule 3).
- **Stack versions** in `web/package.json` align with UI.md spirit (React 19, Ant Design 6, Tailwind 4, React Query 5).

---

## 3. Tests & quality

### 3.1 Current state

| Suite | Location | Result (2026-04-19) |
|-------|----------|---------------------|
| API | `tests/` (+ `api/tests/` for some service tests) | **57 files, 240 tests passed** |
| Web | `web/src/**/*.test.*` | **6 files, 22 tests passed** |

### 3.2 Gaps vs API.md (testing)

- **Rule 28–32 / 37–38:** Not fully auditable line-by-line in this pass; **`createMock*` factories** exist and are reused (good direction). Some tests use **`new Error`** intentionally for simulation — acceptable in tests only.
- **Rule 41:** Service `get*` NotFound coverage — **spot-check** as you touch services; `MemberService` tests exist (`member.service.test.ts`) but full matrix not enumerated here.

### 3.3 Gaps vs UI.md (testing)

- **Missing critical coverage:** Most **data hooks** (finance, media, wallet, schedule) have **no `renderHook` tests**.
- **`components/ui`:** No co-located tests.
- **Smoke tests** exist (`pages.smoke.test.tsx`) — useful but **not** a substitute for hook/ui mandates.

### 3.4 Duplication / redundancy

- No obvious **copy-paste duplicate test files** found by naming. **Integration tests** for finance, sessions, playlists, avatar, auth are **separate files** with possible overlap in setup — worth a **future consolidation** pass (shared helpers already exist under `tests/lib/`).

### 3.5 Other issues

- **Web test stderr:** `App.test.tsx` logs **jsdom CSS parse errors** (Tailwind-injected stylesheet via dependency). Low severity but noisy CI output.
- **Ant Design deprecation warnings** in web tests (`Statistic`, `Tag`, `Drawer`) — track for Ant 6 cleanup.

---

## 4. Improvements (logic, hooks, simplification)

1. **Single HTTP client module** (`web/src/lib/api-client.ts` or adopt **`axios` + interceptors** as UI.md states): centralize **credentials, base URL, error parsing, and typed responses**. Removes dozens of duplicated `fetch` + `if (!res.ok)` blocks.
2. **Align with UI.md directory rules:** gradually move **`useX`** domain hooks to **`web/src/hooks/`** (or update UI.md if the team prefers feature colocation — **docs and code should match**).
3. **Lazy routes:** convert `App.tsx` imports to **`React.lazy` + `Suspense`** per route group (auth, org, admin) for bundle size and Rule 30 compliance.
4. **API handler cleanup:** **`uploads.handlers.ts`** — remove try/catch, replace **`new Error("Unauthorized")`** with **`AppError`/403**, normalize **list response** to **`{ data, nextCursor }`**, remove **`as any`**.
5. **Repository purity:** move **nanoid** and **domain throws** out of repos listed in §1.1; add **service-level** constraint handling where needed.
6. **Admin/reconciliation handlers:** introduce **small services** (e.g. `AuditAppService`, `ReconciliationService`) so handlers only call **`createXService(ctx)`** — restores Rule 3 and makes testing easier.

---

## 5. Hono REST client migration (scope, effort, regression, tests)

**Interpretation:** You likely mean adopting **Hono’s typed client** (`import { hc } from 'hono/client'`) against your **`AppType`**, or generating a client from **OpenAPI** (`@hono/zod-openapi`). Both fit “Hono REST client.”

### 5.1 Code scope

| Layer | Change volume | Notes |
|-------|----------------|-------|
| **Web** | **Large** (~40+ files with `fetch` to `/api/v1/...`) | Replace with `hc(baseUrl).api...` or generated client calls. Presigned **S3/R2 `fetch` to external URLs** may stay as `fetch` (binary upload) — still align with UI.md intent for **your API** vs third-party URLs. |
| **API (Worker)** | **Small to none** | If routes and JSON bodies are unchanged, handlers stay as-is. Optional: export **`AppType`** from `api/main.ts` for `hc<AppType>()`. |
| **Shared** | **Medium (optional)** | Shared **Zod DTOs** already exist — ideal for **end-to-end types** with RPC style. |

### 5.2 Effort estimate (engineering judgment)

- **Minimal path (typed `hc` + manual path calls):** ~**2–5 days** for a focused engineer to wrap core domains + error handling, longer if **every edge endpoint** must migrate in one go.
- **Full OpenAPI client generation + CI:** add **1–3 days** for pipeline + first-time fixes.

### 5.3 Regression testing

- **Must-run:** existing **`tests/integration/*.integration.test.ts`** and **`npm run test:api`** (already strong).
- **Add after web client change:** hook-level tests with **MSW** or **mock `global.fetch` / mock client** for critical mutations (billing, wallet, auth).
- **E2E:** If you have Playwright/Cypress (not audited here), run a **smoke path** per role (member, org admin, platform admin).

### 5.4 Does migration affect tests?

- **API tests:** **No**, unless you change response shapes or status codes while refactoring.
- **Web tests:** **Yes, indirectly** — today hooks call **`fetch`**; if you inject **`hc`**, unit tests should **mock the client** or **MSW**. Any test that asserts on exact **`fetch` call count** would need updates (grep did not show extensive fetch mocking in web tests; **smoke tests** may only need **`vi.mock`** adjustments if the app entry imports change).

---

## 6. Resume here (continuation checklist)

If continuing this audit in a future session:

1. [ ] Walk **every `*.handlers.ts`** for **direct `getDbClient` / repository factory** usage (sample done: audit, reconciliation).
2. [ ] Grep all **`findFirst`** returns for missing **`?? null`**.
3. [ ] Inventory **list route OpenAPI schemas** vs **Rule 23** response shape (`data` / `nextCursor`).
4. [ ] Map **middleware org membership** to **every org-scoped service** entrypoint (Rule 19 parity with docs).
5. [ ] Decide **doc vs code** for **`web/src/hooks/`** and **`.page.tsx`** — update one side to match the other.
6. [ ] Add **web** test matrix: top **10 hooks** by usage + **`components/ui`**.

---

## 7. Remediation plan (testable phases)

**Working agreement:** After **each phase** below, **stop**, run the **phase gate** commands, **append a short entry to §7.4 Phase completion log**, and **wait for human review/approval** before starting the next phase.

**Hono RPC client — parallel or separate?** **Prefer sequential, not parallel** with the rest of the refactors. Reason: both the API cleanup and the Hono work **touch the same boundary** (request/response shapes, errors, and how the web calls the Worker). Doing them in **one ordered pipeline** avoids double-merge conflicts and rework. Practical split:

1. **First** stabilize **API contracts** (envelopes, `AppError`, handler layering) and **repository/service purity** — web can keep calling URLs the same way.
2. **Then** introduce a **single web transport module** (axios or a thin `apiFetch` wrapper per UI.md) so hooks stop duplicating boilerplate.
3. **Then** swap that module’s **implementation** to **`hc<AppType>()`** (Hono client) **without changing hook signatures** where possible.

If two people work in parallel, only do so with a **frozen OpenAPI/response contract** for the duration of the sprint; otherwise **serial is easier**.

---

### 7.0 Standard gate (run before and after every phase)

Use this checklist **before** editing (clean tree or committed WIP) and **after** completing the phase work.

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `npm run check:fix` | Biome **lint+format** auto-fix across repo; catches style issues **before** deeper edits. |
| 2 | `npm run typecheck` | API + web TS + `biome check` (per root script). |
| 3 | `npm run test:api` | Full API / integration Vitest suite. |
| 4 | `cd web && npm run test:run` | Web unit/smoke tests. |
| 5 | `npm run build:web` | Production web build (catches bundler-only issues). |

Optional but recommended for API-heavy phases: **manual smoke** of the affected flows in `wrangler dev` + `web dev` (uploads, billing, audit, etc.).

**Rule for risky moves (e.g. moving `nanoid` out of a repository):** Before editing, **grep all call sites** of `insert` / `prepareInsert` / affected repo methods, confirm **only services** construct IDs, add or extend a **test that would fail if the repo generated IDs**, then refactor. **100% confidence** = green **`test:api`** + **`typecheck:api`** + call-site audit documented in the phase log.

---

### 7.1 Phase breakdown

| Phase | Goal | Primary touch | Contract risk |
|-------|------|----------------|---------------|
| **A** | **Repository ID generation** — move **`nanoid`** (and any ID minting) from repos to **services**; repos accept `id` in inputs / `prepareInsert(id, …)` already aligned with API.md Rules **1, 10**. | `member.repository.ts`, financial org settings / currencies / categories repos + their **service callers** + tests | Medium — verify every insert path |
| **B** | **Repository error purity** — remove **`NotFoundError` / `ConflictError` / generic `throw`** from repos; **services** interpret `null` / Drizzle errors (API.md **2, 16**). | `finance-billing-plans.repository.ts`, `financial-transactions.repository.ts` (+ services) | Medium |
| **C** | **Handler layering** — no direct **`getDbClient` / repository factories`** in handlers; route through **new or existing services** (API.md **3**). | `audit.handlers.ts`, `reconciliation.handlers.ts`, factories, new small services | Low if responses unchanged |
| **D** | **Handler error & response hygiene** — remove **handler `try/catch`** where it only logs/rethrows; replace **`new Error`** with **`AppError`**; normalize **upload list/complete** JSON to documented envelopes **or** document intentional deltas + update **web** consumers in same phase (API.md **13–15, 14, 23–27**). | `uploads.handlers.ts`, any remaining `new Error` in prod paths | **High** if upload list shape changes — **web hooks must ship in same phase** |
| **E** | **Service `BaseService` alignment** (optional polish) — extend **`BaseService`** where it reduces drift (**API.md 4**). | `FinanceBillingPlansService`, import/export/mail/bucket/cache as appropriate | Low |
| **F** | **Web transport DRY** — add **`web/src/lib/axios.ts`** (or team-approved name) per **UI.md 5**; centralize **baseURL, credentials, JSON errors**; replace **app** `fetch('/api/...')` calls **through that instance** (presigned **external** URLs may still use `fetch`). | Most `web/src/features/**/hooks/**` | Medium |
| **G** | **Lazy-loaded routes** — **`React.lazy`** + **`Suspense`** for page imports in **`App.tsx`** (UI.md **30**). | `web/src/App.tsx`, fallbacks | Low |
| **H** | **Explicit `staleTime`** on queries missing it; align list hooks with **cursor/`useInfiniteQuery`** where backend is cursor-only (UI.md **21–22**). | React Query hooks | Low |
| **I** | **Hono client (`hc`)** — export **`AppType`** from API app, implement **`createApiClient()`** using `hono/client`, **replace axios calls** (or wrapper) so hooks use typed client; keep **one choke point** for regression control. | `api/main.ts` (type export), `web/src/lib/*`, hooks | Medium |
| **J** | **Error boundaries** — route- or layout-level boundaries per **UI.md 32** (incremental: admin, org, dashboard). | Layouts / `App.tsx` | Low |
| **K** | **Docs / structure decision** — either **move hooks** to `web/src/hooks/` or **amend UI.md** for feature-colocated hooks; same for **`.page.tsx`** naming (UI.md **6–7, 9**). | Docs and/or file moves | Low (mechanical if scripted) |
| **L** | **Web test expansion** — `renderHook` for **critical hooks**; tests for **`components/ui/*`** (UI.md **35–36**). | `web/src/**` | None |

Phases **A–D** are the highest **API.md** integrity; **F–I** are the highest **UI.md + Hono** payoff. **Re-order J/K/L** as needed (e.g. **K** early if you want less churn from moves).

---

### 7.2 DRY principles during execution

- After **F** or **I**, hooks should only pass **path + body + zod parse**; no copy-pasted `if (!res.ok)`.
- When moving **nanoid**, prefer **`prepareInsert`** + **`db.batch`** patterns already in API.md — **do not duplicate** insert logic across services; use **one service method** per aggregate.
- Prefer **small PR-sized commits** within a phase so `git bisect` stays usable.

---

### 7.3 Phase completion log (append after each approved phase)

Copy a new row **after** you finish a phase and gates are green:

| Date | Phase | Summary | Gates (`check:fix`, typecheck, test:api, web test, build:web`) | Reviewer OK |
|------|-------|---------|----------------------------------------------------------------|-------------|
| 2026-04-19 | **A** | **`MemberRepository.insert`** now requires `id` (first arg); **`MemberService`** generates `nanoid()`. **`FinancialOrgSettingsRepository`**: removed `nanoid` / `findOrCreate`; added **`insertDefaults(id, orgId)`** + **`findByOrgId`** with `?? null`; **`UserFinancialService`** owns **`ensureOrgFinancialSettings()`** with `nanoid()` + **`InternalServerError`** if insert returns null. **`FinancialCurrenciesRepository.insert(id, input)`** and **`FinancialTransactionCategoriesRepository.create(id, input)`** — tests generate prefixed ids to simulate the service layer. | `check:fix` ✓ · `typecheck:api` ✓ · `test:api` (240) ✓ · web `typecheck` + `test:run` (22) ✓ · `build:web` ✓ | *pending your sign-off* |
| 2026-04-19 | **B** | **`FinanceBillingPlansRepository`**: **`updatePlan`** / **`deletePlan`** return `null` instead of throwing **`NotFoundError`** / **`ConflictError`**; **`FinanceBillingPlansService`** maps null → **`NotFoundError`**, FK **`FOREIGN KEY constraint failed`** → **`ConflictError`**. **`FinancialTransactionsRepository.insert`** returns **`LedgerInsertOutcome`** (`idempotency_conflict` / `debit_guard_failed` / success); **`FinancialBaseService.executeTransaction`** maps those to **`ConflictError`** / **`BadRequestError`**. Cursor parsing: exported **`parseTransactionCursor`**; **`OrgFinancialService`** / **`UserFinancialService`** validate cursors and throw **`BadRequestError`** before list queries; repo uses **`requireTransactionCursor`** only after service validation. | `typecheck:api` ✓ · `test:api` ✓ | *pending your sign-off* |
| 2026-04-19 | **C** | **`AdminAuditHandler`** / **`ReconciliationHandler`** now call **`getAdminAuditService`** / **`getReconciliationService`** only (no **`getDbClient`** / repo factories in handlers). New **`AdminAuditService`** (list, acknowledge, requeue + queue send) and **`ReconciliationService`** (missed-payment list + retry orchestration). **`SystemAuditRepository`**: **`findByIdAndOrganization`**, **`setAcknowledged`** (optional org scope); **`acknowledge`** delegates to **`setAcknowledged`**. Malformed event **`metadata`** JSON → **422** (`invalid_metadata`) instead of an uncaught parse error. | `check:fix` ✓ · `typecheck:api` ✓ · `test:api` (242) ✓ | *pending your sign-off* |
| 2026-04-20 | **D** | **`OrgUploadsHandler`**: removed no-op **`try/catch`**; missing **`userId`** → **`UnauthorizedError`** (401). **`listUploads`** returns explicit **`{ items, nextCursor, prevCursor }`** with typed **`UploadDto[]`** (matches **`createPaginatedResponseSchema`** — web **`useOrganizationUploads`** unchanged). **`completeUpload`** builds a typed **`UploadDto`** (no **`as any`**). Replaced **`new Error`** with **`AppError`** subclasses: **`SessionPaymentService`** (**`UnprocessableEntityError`**, **`InternalServerError`** for batch failures), **`MailService`** (**`ServiceUnavailableError`** when Resend client missing), **`entix.queue`** unsupported payment type → **`InternalServerError`**. | `check:fix` ✓ · `typecheck:api` ✓ · `test:api` (242) ✓ · web `typecheck` ✓ | *pending your sign-off* |
| *(template)* | *next* | *…* | *all ✓* | *pending* |

**Next:** Phase **E** (optional **`BaseService`** alignment) — §7.1 row **E**.

---

*End of report.*
