Vocabulary Feature — UI Setup Plan (Web)

This is a clean setup plan aligned to existing frontend conventions in the app:
- feature module under `web/src/features/...`
- query/mutation hooks via `@tanstack/react-query`
- API calls via `getApiClient()` + `hcJson()`
- notifications via `App.useApp()`
- page wiring through existing `App.tsx` route tree.

## 1) Target File Structure

```text
web/src/features/vocabulary/
├── index.ts
├── hooks/
│   └── useVocabulary.ts
└── components/
    ├── VocabularyStatusBadge/
    │   └── index.tsx
    ├── VocabularyTable/
    │   └── index.tsx
    └── AddVocabularyForm/
        └── index.tsx
```

New page:

```text
web/src/pages/teaching/vocabulary/SessionVocabularyPage.tsx
```

## 2) Backend API Mapping (must match existing server routes)

Use these endpoints exactly:

- `POST /api/v1/orgs/:organizationId/vocabulary`
  - body: `{ text: string; sessionId?: string }`
  - response: `{ vocabulary, assignedCount }`

- `GET /api/v1/orgs/:organizationId/sessions/:sessionId/vocabulary`
  - response: assigned rows with joined vocabulary data

- `POST /api/v1/orgs/:organizationId/sessions/:sessionId/vocabulary/:vocabId/assign`
  - body: `{ userId: string; attendanceId: string }`
  - `409` on duplicate explicit assignment

- (optional admin page later) `GET /api/v1/orgs/:organizationId/vocabulary/review`

Dependency note:
- These API routes must exist on the backend branch before UI calls can succeed.
- If backend wiring is not merged yet, expect `404` for vocabulary endpoints until those routes are available.

## 3) Hook Plan — `useVocabulary.ts`

Build one feature hook that exposes:
- `sessionVocabularyQuery` (for `GET /sessions/:sessionId/vocabulary`)
- `createVocabularyMutation` (for `POST /vocabulary`)
- `assignVocabularyMutation` (for explicit assign)

Implementation details:
- Router uses `org/:slug` (not `org/:organizationId`) in `App.tsx`.
- Keep the hook param-driven (`useVocabulary(organizationId, sessionId)`).
- Resolve `organizationId` in the page from `useOrgContext().activeOrganization?.id`, then pass it into the hook.
- Use `enabled: !!organizationId && !!sessionId && isAuthenticated` for session list query.
- Query key shape:
  - `["vocabulary", organizationId, "session", sessionId]`
- Invalidate on successful create/assign:
  - `queryClient.invalidateQueries({ queryKey: ["vocabulary", organizationId] })`
- Keep error typing as `unknown` and narrow safely before reading message.
- Avoid `any` in mutation handlers.

Data typing guidance:
- Define status union:
  - `"new" | "processing_text" | "text_ready" | "processing_audio" | "active" | "review"`
- For session list response, shape should reflect assignment rows + nested vocabulary object (not a flat bank-only array).

## 4) Component Plan

### `VocabularyStatusBadge`
- Pure presentational component using Ant `Tag`.
- Map backend status -> label/color.

### `AddVocabularyForm`
- Inline form with text input + submit button.
- Trim input before submit.
- Disable/loader while pending.

### `VocabularyTable`
- Display:
  - word text
  - zh translation
  - pinyin
  - status badge
  - optional actions
- For session view, rows come from assignment-with-vocabulary response.
- Keep table dumb: callbacks passed from page/hook.

## 5) Page Plan — Session Vocabulary Page

Page responsibilities:
- file path: `web/src/pages/teaching/vocabulary/SessionVocabularyPage.tsx`
- export as named export `SessionVocabularyPage` (for `lazyNamed`)
- resolve `organizationId` from `useOrgContext()` and `sessionId` from params:
  - `const { activeOrganization } = useOrgContext()`
  - `const { sessionId } = useParams<{ sessionId: string }>()`
  - `const organizationId = activeOrganization?.id`
- call `useVocabulary(organizationId, sessionId)`
- render `AddVocabularyForm` + `VocabularyTable`
- call `createVocabularyMutation.mutate({ text, sessionId })` on add
- optional assign action:
  - open simple selector/modal for `(userId, attendanceId)`
  - call `assignVocabularyMutation.mutate(...)`

## 6) Route Wiring

Add session vocabulary route in `App.tsx` under the `teaching` section (teacher/admin/owner flow), not dashboard:

- org base route uses slug:
  - `/org/:slug/...`
- target path:
  - `/org/:slug/teaching/sessions/:sessionId/vocabulary`

Also update teaching/session sub-navigation so the page is reachable.

## 6a) Lazy Registration (Required)

Register the page in `web/src/routes/lazy-pages.ts` with `lazyNamed` before referencing it in `App.tsx`.

Pattern:
- `export const SessionVocabularyPage = lazyNamed(() => import("..."), "SessionVocabularyPage");`

## 7) Barrel Export

`web/src/features/vocabulary/index.ts` should export:
- hook(s)
- components

So page imports stay concise and consistent with other feature modules.

## 8) Validation & QA Checklist

- Add word in session page:
  - success toast appears
  - row appears/refetches
  - `assignedCount` messaging correct
- Duplicate explicit assign:
  - receives `409`
  - shows conflict-friendly message
- Processing statuses render correctly (`new`, `processing_*`, `active`, `review`)
- Unauthorized user cannot hit protected vocabulary actions (verify backend response handling)
- `npm run typecheck:web` passes
- `npm run test:web` relevant tests pass

## 9) Implementation Order

1. Create feature file tree + types
2. Implement `useVocabulary` (query first, then mutations)
3. Build `VocabularyStatusBadge`
4. Build `VocabularyTable`
5. Build `AddVocabularyForm`
6. Build `SessionVocabularyPage` (named export) in `pages/teaching/vocabulary/`
6a. Register `SessionVocabularyPage` in `lazy-pages.ts` with `lazyNamed`
7. Wire route in `App.tsx` under `teaching`, using `org/:slug`
8. Run typecheck + tests
