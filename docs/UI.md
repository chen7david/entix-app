:::v-pre
<!-- AI_CONTEXT
Stack: React 19, Ant Design 6, Tailwind v4, Jotai, React Query 5,
       React Router 7, Vite, Vitest, TypeScript, Cloudflare Workers
Target: Mobile-first fintech SaaS, dark/light mode, WCAG AA
Enforce: All rules below are MANDATORY. Violations = bugs.
-->

# UI.md — Frontend Architecture & Design Standards
# Entix-App Web Layer

> This document defines the mandatory rules for all frontend development on the Entix-App
> web layer. Every rule is numbered for reference in code reviews and audit reports.
> Violations should be treated as bugs, not style preferences.

## Rule Index
| #  | Rule                      | Section           |
|----|---------------------------|-------------------|
| 1  | State Tool Mandate        | 1. Core Stack     |
| 2  | React Query Fetching      | 1. Core Stack     |
| 3  | Jotai Scope               | 1. Core Stack     |
| 4  | Router URL State          | 1. Core Stack     |
| 5  | Axios Instance            | 1. Core Stack     |
| 63 | Dependency Version Sync   | 1. Core Stack     |
| 6  | Directory Structure       | 2. Architecture   |
| 7  | Page Orchestrator         | 2. Architecture   |
| 8  | UI Component Purity       | 2. Architecture   |
| 9  | Naming Conventions        | 2. Architecture   |
| 40 | Container/Presentational  | 2. Architecture   |
| 41 | No Direct APIs            | 2. Architecture   |
| 52 | Reusable Mandate          | 2. Architecture   |
| 56 | Split Conditions          | 2. Architecture   |
| 57 | Feature Module            | 2. Architecture   |
| 58 | Factory Naming            | 2. Architecture   |
| 59 | Helper Rules              | 2. Architecture   |
| 61 | File Colocation           | 2. Architecture   |
| 10 | xs-First Layout           | 3. Mobile UX      |
| 11 | Touch Target (44px)       | 3. Mobile UX      |
| 12 | No Hover-Only             | 3. Mobile UX      |
| 13 | Mobile Baseline Testing   | 3. Mobile UX      |
| 39 | iOS Anti-Zoom             | 3. Mobile UX      |
| 46 | Flex Responsive           | 3. Mobile UX      |
| 49 | Responsive Tables         | 3. Mobile UX      |
| 14 | Source of Truth (Tokens)  | 4. Design System  |
| 15 | Fintech Palette           | 4. Design System  |
| 16 | Ant Design Primitives     | 4. Design System  |
| 17 | Icon Library              | 4. Design System  |
| 45 | Global controlHeight      | 4. Design System  |
| 50 | Spacing Scale             | 4. Design System  |
| 51 | Typography Hierarchy      | 4. Design System  |
| 53 | Color Contrast (WCAG)     | 4. Design System  |
| 54 | Text Casing               | 4. Design System  |
| 18 | Form Zod Binding          | 5. Forms          |
| 19 | Controlled Inputs         | 5. Forms          |
| 47 | Zod Date Validation       | 5. Forms          |
| 20 | Hook Per Domain           | 6. Data Fetching  |
| 21 | Mandatory staleTime       | 6. Data Fetching  |
| 22 | Infinite Scrolling        | 6. Data Fetching  |
| 23 | No Derivation in Effect   | 6. Data Fetching  |
| 60 | Hook Naming Precision     | 6. Data Fetching  |
| 24 | Stable Dependencies       | 7. Optimization   |
| 25 | No Inline Object Props    | 7. Optimization   |
| 26 | Deliberate Memoization    | 7. Optimization   |
| 27 | Bounded Lists             | 7. Optimization   |
| 28 | Stable List Keys          | 7. Optimization   |
| 29 | Debounce & Throttle       | 7. Optimization   |
| 30 | Lazy Loading Pages        | 7. Optimization   |
| 31 | Media Assets              | 7. Optimization   |
| 42 | No Logic in JSX           | 7. Optimization   |
| 43 | Three-State Rendering     | 7. Optimization   |
| 44 | No Side Effects           | 7. Optimization   |
| 32 | Error Boundaries          | 8. Error Handling |
| 33 | Meaningful Fallbacks      | 8. Error Handling |
| 34 | Silent Failure Prohibition| 8. Error Handling |
| 48 | App.useApp Access         | 8. Error Handling |
| 35 | Unit Test Mandate         | 9. Testing        |
| 36 | Hook Test Mandate         | 9. Testing        |
| 37 | Semantic HTML             | 10. Accessibility |
| 38 | ARIA Labels               | 10. Accessibility |
| 55 | Accessibility Checklist   | 10. Accessibility |
| 62 | Document Maintenance      | 11. Maintenance   |

---

## 1. Core Stack & Responsibility Boundaries

### Rule 1 — State Tool Mandate
Each type of state has exactly one owner. Never mix responsibilities.

| State Type       | Tool              |
|------------------|-------------------|
| Server data      | React Query       |
| Global UI state  | Jotai             |
| Local component  | `useState`        |
| URL / nav state  | React Router      |
| Form state       | Ant Design `Form` |

### Rule 2 — React Query is the Only Fetching Layer
- Never use `useEffect` + `useState` to fetch data.
- Never use `axios` directly inside a component.
- All server interaction goes through a `useQuery` or `useMutation` hook.

### Rule 3 — Jotai Scope
- Atoms are for ephemeral client UI state only: modal visibility, sidebar state, selected rows, active tabs.
- Never store server data in a Jotai atom.
- Atoms MUST be declared at module level. Never declare an atom inside a component.

### Rule 4 — React Router for URL-Driven State
- Filters, pagination cursors, active tabs, and search terms that should survive a page refresh MUST live in the URL as query params, not in Jotai or `useState`.

### Rule 5 — Axios Instance
- All HTTP calls MUST use the shared Axios instance from `lib/axios.ts`.
- Never instantiate `axios.create()` in a feature file.
- Never call `fetch()` directly.

### Rule 63 — Dependency Version Synchronization
Developers and AI assistants MUST verify the exact version of core dependencies in `package.json` before implementation.
- **Ant Design (Current: v6)**: Use CSS-in-JS tokens and the `App` component. Avoid deprecated patterns from v4/v5 — static `notification` imports, old `Menu` structures.
- **React (Current: v19)**: Leverage new hooks (`use`, `Transitions`). Avoid deprecated lifecycle methods.
- Using a deprecated API or a version-mismatched pattern is a documented bug.

---

## 2. Component Architecture

### Rule 6 — Directory Structure
```text
src/
  components/
    ui/           ← Pure presentational. No hooks. No Jotai. Props only.
    features/     ← Domain-specific. Uses React Query hooks and Jotai.
    layouts/      ← Page shells and responsive wrappers.
  hooks/          ← Domain hooks: useMemberList.ts, useFinanceStats.ts
  pages/          ← Route components. Thin orchestrators only.
  lib/            ← Shared utilities, axios instance, query client config.
  theme/          ← tokens.ts and Ant Design theme config.
```

### Rule 7 — Page Components are Orchestrators Only
- No inline `useQuery` or `useMutation` calls directly in `.page.tsx` files.
- Pages compose feature components; feature components own data hooks.
- Page files are named `[route].page.tsx` in kebab-case.

### Rule 8 — UI Component Purity
- Components in `ui/` receive data and callbacks via props only.
- No React Query, no Jotai, no API calls inside `ui/` components.
- These components must be fully testable with props alone.

### Rule 9 — Naming Conventions
| Entity         | Convention                   | Example                  |
|----------------|------------------------------|--------------------------|
| Components     | PascalCase `.tsx`            | `MemberCard.tsx`         |
| Hooks          | camelCase, `use-` prefix     | `use-member.ts`          |
| Pages          | kebab-case, `.page.tsx`      | `member-list.page.tsx`   |
| Utility files  | kebab-case                   | `format-currency.ts`     |
| Query keys     | Domain-first string arrays   | `['members', orgId]`     |

### Rule 40 — Component Size & Single Responsibility
A component MUST be split when it exceeds **150 lines** (hard limit). Use a Container/Presentational split:
- **Container** — owns the hook, manages data orchestration, passes data as props.
- **Presentational** — pure visual rendering, receives data via props, lives in `ui/`.
- **Skeleton** — separate file, never inline conditional skeletons.

```ts
// ✅ Correct split
export function MemberCardContainer() {
    const { data } = useMemberById(id);
    return <MemberCard member={data} />;
}
export function MemberCard({ member }: Props) {
    return <div>...</div>;
}
```

### Rule 41 — No APIs Directly in Components
Components MUST NEVER call `axios` or `fetch` directly. All server interaction goes through a hook in `src/hooks/`. This applies to mutations too — no `axios.post()` inline in a click handler.

```ts
// ❌ Prohibited
const handleSubmit = async () => { await axios.post('/api/members', data); };

// ✅ Correct
const { mutate: createMember } = useCreateMember();
const handleSubmit = () => createMember(data);
```

### Rule 52 — Reusable Component Mandate
When a visual pattern appears in two or more places, extract it to `components/ui/`. Extract the **second** time it is used — not the third.
- Shared components MUST accept all visual variations via props.
- Shared components have zero knowledge of domain logic.

Common patterns to extract:

| Pattern                  | Component       |
|--------------------------|-----------------|
| Metric/stat card         | `MetricCard`    |
| Empty state with CTA     | `EmptyState`    |
| Page header with actions | `PageHeader`    |
| Confirmation modal       | `ConfirmModal`  |
| Avatar with fallback     | `UserAvatar`    |
| Status/role badge        | `StatusBadge`   |
| Card loading skeleton    | `CardSkeleton`  |

### Rule 56 — When to Split a Component
Split when **any one** of the following is true:
- File exceeds 150 lines.
- It has more than one reason to change (UI change vs data change).
- Nested conditional rendering exceeds 2 levels deep.
- It manages unrelated state across two different concerns.
- It is reused in two or more places.
- It contains a self-contained visual region with its own heading, data, and actions.

Do NOT split preemptively — extract only when a condition is met.

### Rule 57 — Feature Module Structure
Each domain MUST be self-contained in `features/[domain]/`.

```text
src/features/
  members/
    components/        ← domain-specific, not shared
      MemberCard.tsx
      MemberFilters.tsx
    MembersFeature.tsx ← only export consumed by pages
  finance/
    components/
      CurrencyGrid.tsx
    FinanceFeature.tsx
```

- Feature folders MUST NOT import from other feature folders.
- Cross-feature dependencies go through `components/ui/` or `hooks/`.
- Pages import only the feature root file, never internal components directly.

### Rule 58 — Factory & Provider Naming
| Pattern                  | Convention           | Example              |
|--------------------------|----------------------|----------------------|
| React Context            | `[Domain]Context`    | `AuthContext`        |
| Context Provider         | `[Domain]Provider`   | `AuthProvider`       |
| Context consumer hook    | `use[Domain]`        | `useAuth`            |
| Factory function         | `create[Thing]`      | `createQueryClient`  |
| Config file              | `[thing].config.ts`  | `query.config.ts`    |
| Constants file           | `[domain].constants.ts` | `finance.constants.ts` |
| Type definition file     | `[domain].types.ts`  | `member.types.ts`    |

- Factory functions MUST be pure — no side effects.
- App-wide providers live in `src/providers/`. Domain-scoped providers are co-located in their feature folder.

### Rule 59 — Helper vs Hook
- **Pure transformation** (format date, calculate total) → Helper in `src/lib/`.
- **Logic needing React state or lifecycle** → Custom hook in `src/hooks/`.
- **Logic needing React Query** → Custom hook in `src/hooks/`.
- Helper functions MUST be pure. Never put business logic (permission checks, pricing rules) in a helper.
- Helper files MUST have 100% unit test coverage.

### Rule 61 — Component File Colocation
Tests, types, and barrel exports MUST be co-located in the component folder.

```text
features/members/components/
  MemberCard/
    MemberCard.tsx
    MemberCard.test.tsx
    MemberCard.types.ts
    index.ts            ← barrel export, re-exports only, no logic
```

- Every component folder MUST have an `index.ts` barrel export.
- Exception: simple single-file `ui/` components do not need a subfolder until they accumulate a test and types file.

---

## 3. Mobile-First UX

### Rule 10 — xs-First Layout Mandate
- All layouts MUST be designed at `xs` (≤576px) first. Desktop breakpoints are enhancements.
- Use Ant Design `Col`/`Row` grid with responsive span props for layout.
- No hardcoded pixel widths on containers. Use `%`, `vw`, or the grid system.

### Rule 11 — Touch Target Minimum
- All interactive elements MUST have a minimum tap target of 44×44px.
- Enforced globally via `controlHeight: 44` in `theme/tokens.ts` (Rule 45).

### Rule 12 — No Hover-Only Interactions
- Any UI affordance relying solely on `:hover` MUST have a tap/click equivalent.
- Tooltips that only appear on hover are prohibited on mobile-critical paths.

### Rule 13 — Mobile Baseline Testing
- Every new page or feature MUST be visually verified at 390px (iPhone 14 baseline) using Chrome DevTools Mobile Inspector before it is considered complete.

### Rule 39 — iOS Input Anti-Zoom
All form inputs, textareas, and selects MUST render at minimum **16px font size** on mobile. iOS Safari zooms the viewport on focus of any input below 16px and does **not** zoom back out after blur.
- Enforced via `fontSizeLG: 16` in `tokens.ts`.
- Safety net in `index.css`:
```css
@media (max-width: 576px) {
  input, textarea, select { font-size: 16px !important; }
}
```
- Never use `maximum-scale=1` in the viewport meta tag — it disables user pinch-zoom and violates WCAG 2.1.

### Rule 46 — Ant Design Flex Responsive Pattern
Ant Design `Flex` does NOT support responsive object props on `vertical`. Use `Grid.useBreakpoint()`:

```ts
// ❌ Does not work
<Flex vertical={{ xs: true, md: false }}>

// ✅ Correct
const { xs } = Grid.useBreakpoint();
<Flex vertical={xs} justify="space-between">
```

### Rule 49 — Responsive Tables
Tables MUST be horizontally scrollable on mobile with the actions column pinned on-screen.

```ts
<Table
    rowKey="id"
    scroll={{ x: 'max-content' }}
    tableLayout="fixed"
    columns={[
        { title: 'Name', dataIndex: 'name', width: 200 },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 100,
            render: (_, record) => <ActionMenu record={record} />,
        },
    ]}
/>
```

- Always set explicit `width` on every column when using `scroll={{ x }}`.
- Amount/currency columns MUST use `align: 'right'` (fintech standard).
- Verify all tables at 390px as part of the mobile audit (Rule 13).

---

## 4. Design System & Theming

### Rule 14 — Single Source of Truth
- All design tokens are defined in `src/theme/tokens.ts`.
- Tailwind v4 variables in `src/index.css` MUST map to the same token values.
- Never hardcode color hex values in component files.

### Rule 15 — Fintech Palette
| Role         | Token             | Value       |
|--------------|-------------------|-------------|
| Primary      | `colorPrimary`    | `#2563eb`   |
| Neutral base | `colorNeutral-*`  | Slate scale |
| Success      | `colorSuccess`    | Emerald     |
| Danger       | `colorError`      | Rose        |
| Warning      | `colorWarning`    | Amber       |

### Rule 16 — Ant Design Primitives
- Use Ant Design primitives for all UI chrome. Never build a custom button, input, modal, dropdown, or table if Ant Design provides one.
- Never override Ant Design internals via CSS class selectors. Use the `styles` / `classNames` / `token` API exclusively.

### Rule 17 — Icon Library
- Default: `@ant-design/icons`.
- Lucide is permitted ONLY when a required icon is absent from Ant Design Icons. Add a comment: `// Not available in @ant-design/icons`.
- Never mix icon sizing conventions. Use `style={{ fontSize }}` consistently.

### Rule 45 — Global controlHeight
Never set `height: 44px` on individual components. Set it once in `tokens.ts` to cascade globally:

```ts
controlHeight: 44,
controlHeightLG: 48,
controlHeightSM: 32,
fontSizeLG: 16,     // also satisfies Rule 39
```

### Rule 50 — Spacing Scale
Never use arbitrary pixel values for spacing. Use `token.padding*` and `token.margin*`:

| Token             | Value | Use                              |
|-------------------|-------|----------------------------------|
| `token.paddingXS` | 8px   | Tags, badges                     |
| `token.paddingSM` | 12px  | Table cells, compact cards       |
| `token.padding`   | 16px  | Default component padding        |
| `token.paddingLG` | 24px  | Card bodies, section padding     |
| `token.paddingXL` | 32px  | Page-level section gaps          |
| `token.paddingXXL`| 48px  | Hero sections, major divisions   |

- Card body padding: `token.paddingLG` (24px) on desktop, `token.padding` (16px) on mobile.
- Page-level horizontal padding MUST be defined once in the shared layout, never per-page.

### Rule 51 — Typography Hierarchy
Use Ant Design `Typography` components exclusively. Never use raw `<h1>`–`<h6>` or `<p>` tags styled with Tailwind font utilities.

| Level           | Component                         | Use                              |
|-----------------|-----------------------------------|----------------------------------|
| Page title      | `<Typography.Title level={2}>`    | One per page                     |
| Section header  | `<Typography.Title level={4}>`    | Card titles, drawer sections     |
| Sub-label       | `<Typography.Text strong>`        | Field labels, stat labels        |
| Body block      | `<Typography.Paragraph>`          | Block-level paragraphs           |
| Body inline     | `<Typography.Text>`               | Inline descriptions, helper text |
| Secondary       | `<Typography.Text type="secondary">` | Timestamps, placeholders      |
| Danger          | `<Typography.Text type="danger">` | Error messages                   |
| Code/IDs        | `<Typography.Text code>`          | Account IDs, reference numbers   |
| Statistics      | `<Statistic>`                     | All monetary/numeric values      |

- Never use `text-xl`, `text-2xl`, or Tailwind font-size utilities for content hierarchy.
- `<Statistic>` MUST always have a meaningful `title` prop.
- Font weight controlled via `strong` or token only — never via `font-bold`.

### Rule 53 — Color Contrast & Dark Mode
All text/background combinations MUST meet WCAG AA minimum (4.5:1 normal text, 3:1 large text). Dark mode MUST be explicitly verified for every new component.
- Status colors MUST use paired semantic tokens:
```ts
// ✅ Correct — paired tokens ensure contrast in both modes
background: token.colorSuccessBg
color:      token.colorSuccess
border:     token.colorSuccessBorder
```
- Never place `type="secondary"` text on a non-white background without verifying contrast.

### Rule 54 — Text Casing
| Context             | Rule                                      |
|---------------------|-------------------------------------------|
| Page titles         | Title Case                                |
| Section headers     | Title Case                                |
| Button labels       | Title Case (`Save Changes`, not `SAVE`)   |
| Form labels         | Sentence case (`First name`)              |
| Table column headers| Title Case                                |
| Status badges       | ALL CAPS only for short codes (`KYC`, `2FA`) |
| Body text           | Sentence case                             |
| Navigation items    | Title Case                                |

- `ALL CAPS` body text and `text-transform: uppercase` in styles are prohibited.
- Never title-case full sentences in confirmation dialogs.

---

## 5. Forms

### Rule 18 — Ant Design Form + Zod Mandate
- All forms MUST use Ant Design `Form` with `antd-zod` for schema binding.
- No manual validation logic inside components.
- Zod schemas that mirror API inputs MUST be defined in `shared/` and imported in both the form and the backend handler.

### Rule 19 — Controlled Inputs
- All form inputs MUST be controlled through Ant Design `Form.Item`.
- Never use `ref`-based or uncontrolled input patterns for form data collection.

### Rule 47 — Zod Date Validation
Scheduled datetime fields MUST include a future-date refinement using a `Date` object comparison — never `Date.now()` directly as it returns a number, not a `Date`:

```ts
startTime: z.coerce.date().refine(
    (date) => date > new Date(Date.now() - 60000), // 1-min grace window
    { message: "Must be scheduled in the future" }
)
```

---

## 6. Data Fetching & React Query

### Rule 20 — Hook Per Domain
- One React Query hook file per backend domain in `src/hooks/`.
- Export one `useQuery` wrapper and one `useMutation` wrapper per operation.

### Rule 21 — Mandatory staleTime
- Every `useQuery` MUST declare an explicit `staleTime`. Default `staleTime: 0` is prohibited.
- Reference data: `staleTime: 1000 * 60` (1 min).
- Transactional data: `staleTime: 1000 * 30` (30 sec).

### Rule 22 — Cursor Pagination
- All list queries MUST use cursor-based pagination via `useInfiniteQuery`. Offset-based pagination is prohibited.
- Use `placeholderData: keepPreviousData` on all paginated and filtered queries.

### Rule 23 — No Data Derivation in useEffect
- Never use `useEffect` to derive data from a `useQuery` result into local state.
- Use the `select` option in `useQuery` instead:

```ts
// ✅ Correct
const { data: activeMembers } = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers,
    select: (data) => data.filter(m => m.active),
    staleTime: 1000 * 60,
});
```

### Rule 60 — Hook Naming Precision
Hook names MUST describe exactly what they return or do:
- **Query hooks**: `use[Domain][Shape]` → `useMemberList`, `useSessionById`
- **Mutation hooks**: `use[Verb][Domain]` → `useCreateMember`, `useDeactivateAccount`
- **UI state hooks**: `use[What it controls]` → `useModalState`, `useFilterState`

Never export two unrelated concerns from one hook file.

---

## 7. Performance & Optimization

### Rule 24 — Stable useEffect Dependencies
- Every `useEffect` MUST have an explicit dependency array.
- Never place non-primitive values in a dependency array without stabilizing with `useMemo` or `useCallback`.

```ts
// ✅ Stable reference
const filters = useMemo(() => ({ status: 'active' }), []);
useEffect(() => fetchData(filters), [filters]);
```

### Rule 25 — No Inline Object/Function Props
Never pass inline objects, arrays, or arrow functions as props to `React.memo` components or as `useCallback`/`useMemo` dependencies.

### Rule 26 — Deliberate Memoization
Do not wrap every component in `React.memo` by default. Apply only where a component demonstrably re-renders with unchanged props.

| Scenario                                   | Tool            |
|--------------------------------------------|-----------------|
| Expensive pure computation                 | `useMemo`       |
| Stable callback passed to child            | `useCallback`   |
| Component re-renders with unchanged props  | `React.memo`    |
| Server data transformation                 | `select` option |

### Rule 27 — Bounded Lists
Any list rendering more than 50 items MUST use cursor pagination (`useInfiniteQuery`) or a virtualized list. Never render an unbounded array.

### Rule 28 — Stable List Keys
All `key` props MUST be stable unique IDs from the data. Array indices as keys are prohibited for dynamic lists. Ant Design `Table` MUST always set `rowKey` to a stable field.

### Rule 29 — Debounce & Throttle
- All search inputs MUST be debounced using `@tanstack/react-pacer`.
- All `scroll`, `resize`, and `mousemove` handlers MUST be throttled.
- Never call a React Query mutation inside a loop — batch via a single array-accepting endpoint.

### Rule 30 — Lazy Loading Pages
All page-level components MUST be lazy-loaded. No page may be in the main bundle.

```ts
const MemberListPage = React.lazy(() => import('./pages/member-list.page'));
```

### Rule 31 — Media & Heavy Assets
- All media served via Uppy/R2 MUST use presigned URLs. Never proxy binary data through a Cloudflare Worker.
- Vidstack player components MUST be lazy-loaded.

### Rule 42 — No Logic Inside JSX
Never perform filtering, sorting, or mapping inline inside JSX. All derivations MUST happen before the return or in a `useMemo`.

```ts
// ❌ Prohibited
return data.filter(m => m.active).map(m => <MemberCard key={m.id} member={m} />);

// ✅ Correct
const activeMembers = useMemo(() => data?.filter(m => m.active) ?? [], [data]);
return activeMembers.map(m => <MemberCard key={m.id} member={m} />);
```

### Rule 43 — Three-State List Rendering
Every list rendered from server data MUST explicitly handle three states:

```ts
if (isLoading) return <CardSkeleton />;
if (!members.length) return <Empty description="No members found" />;
return members.map(m => <MemberCard key={m.id} member={m} />);
```

### Rule 44 — No Side Effects in Render
Components MUST NOT produce side effects inside the render body. No `console.log`, no DOM writes, no `localStorage` access. Encapsulate in `useEffect` or a dedicated custom hook.

---

## 8. Error Handling

### Rule 32 — Error Boundary Placement
- Every route-level page MUST be wrapped in an `ErrorBoundary`.
- Every independently fetching section (card or panel with its own `useQuery`) MUST have its own `ErrorBoundary`.

### Rule 33 — Meaningful Fallbacks
- Every `ErrorBoundary` MUST render a meaningful fallback — never `null` or a blank `<div>`.
- Fallbacks MUST include a user-facing message and, where appropriate, a retry action.

### Rule 34 — Silent Failure Prohibition
- `useMutation` calls MUST handle `onError` explicitly.
- Never allow a failed mutation to fail silently. Display `notification.error` or `message.error` at minimum.

### Rule 48 — App.useApp for Notifications
Never use static `notification.error()` or `message.error()` imports. Always access via `App.useApp()` for context-aware rendering:

```ts
const { notification, message } = App.useApp();
```

---

## 9. Testing

### Rule 35 — Component Test Mandate
- Every `ui/` component MUST have a co-located test covering default render, prop variations, and user interaction callbacks.
- Tests use `@testing-library/react` and `vitest`.

### Rule 36 — Hook Test Mandate
- Every custom hook in `hooks/` MUST have a unit test using `renderHook`.
- Mock React Query and Jotai — never test against a live API in unit tests.

---

## 10. Accessibility

### Rule 37 — Semantic HTML
- Use semantic elements (`<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`) for page structure.
- Never use `<div>` or `<span>` for interactive elements. Use `<button>` or `<a>`.

### Rule 38 — ARIA Labels
- All icon-only buttons MUST have a descriptive `aria-label`.
- All form inputs MUST have an associated label via Ant Design `Form.Item`'s `label` prop.

### Rule 55 — Accessibility Checklist
Every component MUST pass this checklist before a PR is merged:

**Keyboard navigation:**
- All interactive elements reachable via `Tab` key.
- Focus MUST be trapped inside modals and drawers while open.
- `Escape` MUST close all modals, drawers, and dropdowns.

**Screen readers:**
- Dynamic content changes (loading, success, errors) MUST use `aria-live` regions or Ant Design's notification system.
- Meaningful images and icons MUST have `alt` or `aria-label`. Decorative icons MUST have `aria-hidden="true"`.

**Color independence:**
- Never convey information by color alone. Every color-coded state MUST also have a text label or icon.
```ts
// ✅ Color + label — never color alone
<Badge color="green" text="Active" />
```

**Motion:**
- Respect `prefers-reduced-motion`. No auto-playing animations on critical UI paths.
- Disable globally in tokens when needed: `motionDuration: '0s'`.

---

## 11. Maintenance

### Rule 62 — Document Maintenance
When a new architectural pattern is established or an existing rule is refined, this document MUST be updated as a single commit before the task is closed.
- Rule numbers are **permanent reference handles** and MUST NOT be renumbered, even if reordered between sections.
- Retired rules MUST be marked `[DEPRECATED]` — never deleted — to preserve historical PR references.
- Every update MUST include a version bump and update to the Rule Index and AI Context header if the stack evolves.

---

*UI.md — Entix-App Frontend Standards*
*Version: 1.2.1 (Last Updated: 2026-04-01)*
:::