::: v-pre
# UI.md — Frontend Architecture & Design Standards
# Entix-App Web Layer

> This document defines the mandatory rules for all frontend development on the Entix-App
> web layer. Every rule is numbered for reference in code reviews and audit reports.
> Violations should be treated as bugs, not style preferences.

---

## 1. Core Stack & Responsibility Boundaries

### Rule 1 — State Tool Mandate
Each type of state has exactly one owner. Never mix responsibilities.

| State Type          | Tool               |
|---------------------|--------------------|
| Server data         | React Query        |
| Global UI state     | Jotai              |
| Local component     | `useState`         |
| URL / nav state     | React Router       |
| Form state          | Ant Design `Form`  |

### Rule 2 — React Query is the Only Fetching Layer
- Never use `useEffect` + `useState` to fetch data.
- Never use `axios` directly inside a component.
- All server interaction goes through a `useQuery` or `useMutation` hook.

### Rule 3 — Jotai Scope
- Jotai atoms are for ephemeral client UI state only: modal visibility, sidebar state,
  selected rows, active tabs.
- Never store server data in a Jotai atom.
- Atoms MUST be declared at module level. Never declare an atom inside a component.

### Rule 4 — React Router for URL-Driven State
- Filters, pagination cursors, active tabs, and search terms that should survive a
  page refresh MUST live in the URL as query params, not in Jotai or useState.

### Rule 5 — Axios Instance
- All HTTP calls MUST use the shared Axios instance from `lib/axios.ts`.
- Never instantiate `axios.create()` in a feature file.
- Never call `fetch()` directly.

---

## 2. Component Architecture

### Rule 6 — Directory Structure
```text
src/
  components/
    ui/ ← Pure presentational. No hooks that fetch. No Jotai. Props only.
    features/ ← Domain-specific. May use React Query hooks and Jotai.
    layouts/ ← Page shells and responsive wrappers.
  hooks/ ← One file per backend domain: use-member.ts, use-finance.ts
  pages/ ← Route-level components. Thin orchestrators only.
  lib/ ← Shared utilities, axios instance, query client config.
  theme/ ← tokens.ts and Ant Design theme config.
```

### Rule 7 — Page Components are Orchestrators Only
- No inline `useQuery` or `useMutation` calls directly in `.page.tsx` files.
- Pages compose feature components; feature components own data hooks.
- Page files are named `[route].page.tsx` in kebab-case.

### Rule 8 — UI Component Purity
- Components in `components/ui/` receive data and callbacks via props only.
- No React Query, no Jotai, no API calls inside `ui/` components.
- These components must be fully testable with props alone.

### Rule 9 — Naming Conventions
| Entity              | Convention                              | Example                    |
|---------------------|-----------------------------------------|----------------------------|
| Components          | PascalCase `.tsx`                       | `MemberCard.tsx`           |
| Hooks               | camelCase, `use-` prefix                | `use-member.ts`            |
| Pages               | kebab-case, `.page.tsx` suffix          | `member-list.page.tsx`     |
| Utility files       | kebab-case                              | `format-currency.ts`       |
| Query keys          | Domain-first string arrays              | `['members', orgId]`       |

### Rule 52 — Reusable Component Mandate
When two or more places in the codebase render the same visual pattern, a shared component MUST be created in `components/ui/`. Copy-pasting JSX between feature components is prohibited.

Common patterns that MUST be extracted:

| Pattern | Shared Component |
|---------|------------------|
| Metric/stat card | `MetricCard` |
| Empty state with CTA | `EmptyState` |
| Page header with actions | `PageHeader` |
| Confirmation modal | `ConfirmModal` |
| Avatar with fallback | `UserAvatar` |
| Status/role badge | `StatusBadge` |
| Loading skeleton for cards | `CardSkeleton` |

- A shared component is justified the second time a pattern appears — not the third.
- Shared components MUST accept all visual variations via props, not via internal conditionals tied to domain logic.
- Never create a shared component that imports from a feature folder — `ui/` components have zero knowledge of domain concerns.

### Rule 56 — When to Split a Component
A component MUST be split when any one of the following is true:
- It exceeds 150 lines (Rule 40 reinforced — this is the hard limit).
- It has more than one reason to change — if a UI change and a data change would both require editing the same file, it needs splitting.
- It contains nested conditional rendering more than 2 levels deep — extract each branch into a named component.
- It manages unrelated state — e.g. a component tracking both a modal's open state and a form's dirty state for two different features.
- It is reused in two or more places — extract immediately on the second usage, not the third.
- It contains a self-contained visual region with its own heading, data, and actions (e.g. a stats card, a danger zone, a filter bar).

**Do NOT split preemptively.** Extract components only when one of the above conditions is actually met. Premature decomposition creates indirection without benefit.

```ts
// ❌ Split too early — no real reason yet
<MemberCardNameSection />   // just renders a <p>

// ✅ Split because it has its own state, heading, and actions
<MemberDangerZone member={member} onRemove={onRemove} />
```

### Rule 57 — Feature Module Structure
Each domain feature MUST be self-contained in a `features/[domain]/` folder. A feature module owns everything specific to that domain.

```text
src/
  features/
    members/
      components/       ← domain-specific components (not shared)
        MemberCard.tsx
        MemberFilters.tsx
      MembersFeature.tsx ← feature root, composed into a page
    finance/
      components/
        CurrencyGrid.tsx
        AccountCard.tsx
      FinanceFeature.tsx
```

Rules for feature modules:
- A feature folder MUST NOT import from another feature folder. Cross-feature dependencies go through `components/ui/` (shared) or `hooks/` (shared data).
- The feature root file (e.g. `MembersFeature.tsx`) is the only export consumed by pages — pages never import directly from `features/[domain]/components/`.
- Feature components MAY use React Query hooks and Jotai atoms scoped to their domain.

### Rule 58 — Factory & Provider Naming
Factories, providers, and context files follow strict naming conventions.

| Pattern | Convention | Example |
|---------|------------|---------|
| React Context | `[Domain]Context` | `AuthContext` |
| Context Provider component | `[Domain]Provider` | `AuthProvider` |
| Context consumer hook | `use[Domain]` | `useAuth` |
| Factory function (returns instance) | `create[Thing]` | `createQueryClient` |
| Config/setup file | `[thing].config.ts` | `query.config.ts` |
| Constants file | `[domain].constants.ts` | `finance.constants.ts` |
| Type definition file | `[domain].types.ts` | `member.types.ts` |

- Never name a context file `context.ts` without a domain prefix.
- Factory functions MUST be pure — they return a new instance each call with no side effects.
- Providers MUST live in `src/providers/` if they wrap the entire app, or co-located in their feature folder if scoped to that domain.

### Rule 59 — Helper & Utility Rules
Helpers and utilities are pure functions with no side effects and no React dependencies. They live in `src/lib/` (app-wide) or co-located in their feature folder (domain-scoped).

**When to write a helper vs a hook:**
- **Pure transformation** (format date, calculate total) → Helper in `lib/`.
- **Logic that needs React state or lifecycle** → Custom hook in `hooks/`.
- **Logic that needs React Query** → Custom hook in `hooks/`.
- **Logic shared across features with no React dependency** → Helper in `lib/`.

```ts
// Helpers — verb describing the transformation
formatCurrency(amount, currency)
calculateDuration(start, end)

// Hooks — use + noun describing what it manages
useMemberList()
useSessionForm()
```

- Helper functions MUST be pure — same input always produces same output, no external state reads.
- Never put business logic (e.g. permission checks, pricing rules) in a helper. Business logic belongs in a hook or service layer.
- Helper files MUST have 100% unit test coverage.

### Rule 61 — Component File Colocation
Tests, types, and styles for a component MUST be co-located in the same folder as the component.

```text
features/members/components/
  MemberCard/
    MemberCard.tsx
    MemberCard.test.tsx    ← co-located test
    MemberCard.types.ts    ← local types if complex
    index.ts               ← barrel export
```

- Every component folder MUST have an `index.ts` barrel export.
- Barrel exports MUST only re-export — never contain logic.
- Exception: `components/ui/` — simple single-file components do not need a subfolder until they accumulate a test and types file.

---

## 3. Mobile-First UX

### Rule 10 — xs-First Layout Mandate
- All layouts MUST be designed at `xs` (≤576px) first.
- Desktop breakpoints (`md`, `lg`, `xl`) are enhancements, not the base.
- Use Ant Design's `Col`/`Row` grid with responsive span props exclusively for layout.
- No hardcoded pixel widths on containers. Use `%`, `vw`, or the grid system.

### Rule 11 — Touch Target Minimum
- All interactive elements (buttons, icon buttons, links, form controls) MUST have a
  minimum tap target of 44×44px.
- Use Ant Design size props (`size="large"`) or Tailwind padding utilities to enforce this.

### Rule 12 — No Hover-Only Interactions
- Any UX affordance that relies solely on `:hover` MUST have an equivalent tap/click behavior.
- Tooltips that only appear on hover are prohibited on mobile-critical paths.

### Rule 13 — Mobile Baseline Testing
- Every new page or feature MUST be visually verified at 390px width (iPhone 14 baseline)
  using Chrome DevTools Mobile Inspector before it is considered complete.

### Rule 49 — Responsive Table Behavior
Ant Design Table components MUST be horizontally scrollable on mobile with the actions column pinned on-screen. Never let an actions column scroll out of view.

Implement this with `scroll={{ x: 'max-content' }}` on the table and `fixed: 'right'` on the actions column definition:

```ts
// ✅ Correct — table scrolls, actions stay visible
<Table
    dataSource={members}
    rowKey="id"
    scroll={{ x: 'max-content' }}
    columns={[
        { title: 'Name', dataIndex: 'name', width: 200 },
        { title: 'Role', dataIndex: 'role', width: 150 },
        { title: 'Joined', dataIndex: 'createdAt', width: 150 },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',   // ← pinned
            width: 100,
            render: (_, record) => <ActionMenu record={record} />,
        },
    ]}
/>
```

**Additional requirements:**
- Always set explicit width on every column when using `scroll={{ x }}` — Ant Design requires this for fixed columns to calculate the scroll container correctly. Omitting widths causes layout bugs.
- The actions column width MUST be the minimum needed to fit its content — never use a wide fixed column that consumes too much of the mobile viewport.
- Verify all tables at 390px in Chrome DevTools as part of the mobile audit (Rule 13).

---

## 4. Design System & Theming

### Rule 14 — Single Source of Truth for Tokens
- All design tokens (colors, spacing, radius, typography) are defined in
  `src/theme/tokens.ts`.
- Tailwind v4 theme variables are configured in `src/index.css` and MUST map to the
  same token values to ensure Ant Design and Tailwind stay in sync.
- Never hardcode color hex values in component files.

### Rule 15 — Premium Fintech Palette
| Role        | Token              | Value       |
|-------------|--------------------|-------------|
| Primary     | `color-primary`    | `#2563eb`   |
| Neutral base| `color-neutral-*`  | Slate scale |
| Success     | `color-success`    | Emerald     |
| Danger      | `color-danger`     | Rose        |
| Warning     | `color-warning`    | Amber       |

### Rule 16 — Ant Design Component Usage
- Use Ant Design primitives for all UI chrome. Never build a custom button, input,
  modal, dropdown, or table if Ant Design provides one.
- Do not override Ant Design component internals via CSS class selectors.
  Use the `styles` / `classNames` / `token` API exclusively for customization.

### Rule 17 — Icon Library
- Default icon library: `@ant-design/icons`.
- Lucide icons are permitted ONLY if the required icon does not exist in Ant Design Icons.
  When used, add a comment explaining why: `// Not available in @ant-design/icons`.
- Never mix icon sizing conventions. Use Ant Design's `style={{ fontSize }}` consistently.

### Rule 50 — Spacing Scale
All padding, margin, and gap values MUST come from the Ant Design spacing scale via `token.padding*` and `token.margin*` tokens, or Tailwind's spacing scale. Never use arbitrary pixel values for spacing in component files.

| Token | Value | Use |
|-------|-------|-----|
| `token.paddingXS` | 8px | Tight internal padding (tags, badges) |
| `token.paddingSM` | 12px | Compact elements (table cells, small cards) |
| `token.padding`   | 16px | Default component padding |
| `token.paddingLG` | 24px | Section padding, card bodies |
| `token.paddingXL` | 32px | Page-level section gaps |
| `token.paddingXXL`| 48px | Hero sections, major page divisions |

- Card body padding MUST be `token.paddingLG` (24px) on desktop, `token.padding` (16px) on mobile (xs).
- Page-level horizontal padding MUST be consistent across all pages — define once in the shared layout component, never per-page.
- Never mix Tailwind spacing utilities and inline `style={{ padding }}` on the same element.

### Rule 51 — Typography Hierarchy
Text styles MUST follow a consistent hierarchy using Ant Design Typography components. Never use raw `<h1>`–`<h6>` or `<p>` tags styled manually with Tailwind font utilities.

| Level | Component | Use |
|-------|-----------|-----|
| Page title | `<Typography.Title level={2}>` | One per page, top of content |
| Section header | `<Typography.Title level={4}>` | Card titles, drawer sections |
| Sub-label | `<Typography.Text strong>` | Field labels, stat labels |
| Body | `<Typography.Text>` | Descriptions, helper text |
| Muted/secondary | `<Typography.Text type="secondary">` | Placeholders, empty states, timestamps |
| Danger | `<Typography.Text type="danger">` | Error messages, destructive labels |
| Code/IDs | `<Typography.Text code>` | Account IDs, reference numbers |

- Never use `text-xl`, `text-2xl`, or other Tailwind font-size utilities for content hierarchy. Reserve Tailwind typography utilities for layout-level text (e.g. nav labels) only.
- All monetary values and numeric statistics MUST use `<Statistic>` from Ant Design — never a raw `<span>` with a large font size.
- Font weight MUST only be controlled via `strong`, `type`, or `token` — never via `font-bold` in content components.

### Rule 53 — Color Usage & Contrast
All text/background color combinations MUST meet WCAG AA contrast minimum (4.5:1 for normal text, 3:1 for large text and UI components). This is not optional — it is a baseline accessibility and professionalism standard used by every major product (Apple, Stripe, Linear).

Enforcement rules:
- Never use `type="secondary"` text (`token.colorTextSecondary`) on a non-white background without verifying contrast.
- Never place light-colored text on `colorFillQuaternary` or `colorFillTertiary` backgrounds without testing.
- Status colors (success, warning, danger) MUST use the Ant Design semantic background + foreground token pairs — never a raw color on a white background alone:
```ts
// ✅ Correct — paired tokens ensure contrast
background: token.colorSuccessBg
color: token.colorSuccess
border: token.colorSuccessBorder
```
- Dark mode MUST be explicitly verified for every new component — token pairs that look fine in light mode can fail contrast in dark mode.

### Rule 54 — Capitalization & Text Casing
Text casing MUST follow platform conventions. Never use `text-uppercase` CSS or `toUpperCase()` to style content — casing is a content decision, not a style decision.

| Context | Rule |
|---------|------|
| Page titles | Title Case |
| Section headers | Title Case |
| Button labels | Title Case (Save Changes, not SAVE CHANGES) |
| Form labels | Sentence case (First name, not First Name) |
| Table column headers | Title Case |
| Status tags/badges | ALL CAPS only for short codes (e.g. KYC, 2FA) |
| Body/description text | Sentence case |
| Navigation items | Title Case |

- ALL CAPS body text is prohibited — it reduces readability and signals poor design craft.
- Avoid title-casing full sentences. "Are you sure you want to delete this member?" is correct. "Are You Sure You Want To Delete This Member?" is not.

---

## 5. Forms

### Rule 18 — Ant Design Form + Zod Mandate
- All forms MUST use Ant Design `Form` with `antd-zod` for schema binding.
- No manual validation logic inside components.
- Zod schemas for forms that mirror API inputs MUST be defined in `shared/` and
  imported in both the frontend form and the backend handler.

### Rule 19 — No Uncontrolled Inputs
- All form inputs MUST be controlled through Ant Design `Form.Item`.
- Never use `ref`-based or uncontrolled input patterns for form data collection.

---

## 6. Data Fetching & React Query Standards

### Rule 20 — Hook File Per Domain
- One React Query hook file per backend domain: `use-member.ts`, `use-finance.ts`, etc.
- Hook files live in `src/hooks/`.
- Export one `useQuery` wrapper and one `useMutation` wrapper per operation.

### Rule 21 — staleTime is Mandatory
- Every `useQuery` call MUST declare an explicit `staleTime`.
- Default `staleTime: 0` is prohibited — it causes a refetch on every component mount.
- Recommended defaults: `staleTime: 1000 * 60` (1 min) for reference data,
  `staleTime: 1000 * 30` (30 sec) for transactional data.

### Rule 22 — Paginated Queries
- All list queries MUST use cursor-based pagination via `useInfiniteQuery` or
  query-param cursor pattern.
- Offset-based pagination is prohibited.
- Use `placeholderData: keepPreviousData` on all paginated and filtered queries to
  prevent empty flashes between page transitions.

### Rule 23 — No Data Derivation in useEffect
- Never use `useEffect` to derive or transform data from a `useQuery` result into
  local state.
- Use the `select` option in `useQuery` to transform data at the query level.

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
Hook names MUST describe exactly what they return or manage — not just the domain.

```ts
// ✅ Precise
useMemberList()           // returns paginated list
useMemberById(id)         // returns single member
useCreateMember()         // returns mutation for creating
useUpdateMemberRole()     // returns mutation for role update
```

Rules:
- Query hooks are named after what they return: `use[Domain][Shape]` → `useMemberList`, `useSessionById`.
- Mutation hooks are named after what they do: `use[Verb][Domain]` → `useCreateMember`, `useDeactivateAccount`.
- Hooks that manage local UI state are named after what they control: `useModalState`, `useFilterState`, `useTableSelection`.
- Never export two concerns from one hook file under a generic name — split them.

---

## 7. Performance & Optimization

### Rule 24 — Stable useEffect Dependencies
- Every `useEffect` MUST have an explicit dependency array.
- Never place non-primitive values (objects, arrays, functions) in a dependency array
  without first stabilizing them with `useMemo` or `useCallback`.

```ts
// ✅ Stable reference
const filters = useMemo(() => ({ status: 'active' }), []);
useEffect(() => fetchData(filters), [filters]);
```

### Rule 25 — No Inline Object/Function Props on Memoized Components
- Never pass inline objects, arrays, or arrow functions as props to `React.memo`
  components or as dependencies to `useCallback`/`useMemo`.

### Rule 26 — Deliberate Memoization
- Do not wrap every component in `React.memo` by default.
- Apply memoization only where a component demonstrably re-renders with unchanged props.

| Scenario | Tool |
|----------|------|
| Expensive pure computation | `useMemo` |
| Stable callback passed to child | `useCallback` |
| Component re-renders with unchanged props | `React.memo` |
| Server data transformation | `select` option |

### Rule 27 — Unbounded Lists are Prohibited
- Any list rendering more than 50 items MUST use one of:
  - Cursor-based pagination with React Query `useInfiniteQuery`
  - A virtualized list component
- Never render an unbounded array directly to the DOM.

### Rule 28 — Stable List Keys
- All list `key` props MUST be stable unique IDs from the data.
- Array indices as keys are prohibited for any dynamic list.
- Ant Design `Table` MUST always set `rowKey` to a stable unique field.

### Rule 29 — Debounce & Throttle Mandate
- All search inputs MUST be debounced using `@tanstack/react-pacer`.
- All `scroll`, `resize`, and `mousemove` event handlers MUST be throttled.
- Never call a React Query mutation inside a loop. Batch operations must go through
  a single API endpoint that accepts arrays.

### Rule 30 — Lazy Loading Pages
- All page-level components MUST be lazy-loaded with `React.lazy` + `Suspense`.
- No page component may be included in the main bundle.

```ts
// ✅ Correct
const MemberListPage = React.lazy(() => import('./pages/member-list.page'));
```

### Rule 31 — Media & Heavy Assets
- All media (images, video) served via Uppy/R2 MUST use presigned URLs.
- Never proxy binary data through a Cloudflare Worker.
- Vidstack player components MUST be lazy-loaded. Video player libraries must
  never block initial render.

---

## 8. Error Handling

### Rule 32 — Error Boundary Placement
- Every route-level page MUST be wrapped in a `react-error-boundary` `ErrorBoundary`.
- Every independently fetching section (a card or panel with its own `useQuery`) MUST
  have its own `ErrorBoundary` so a single widget failure cannot crash the page.

### Rule 33 — Meaningful Fallbacks
- Every `ErrorBoundary` MUST render a meaningful fallback UI — never a blank `<div>`
  or `null`.
- Fallbacks must include a user-facing message and, where appropriate, a retry action.

### Rule 34 — No Silent Failures
- `useMutation` calls MUST handle `onError` explicitly.
- Never allow a failed mutation to fail silently. At minimum, display an Ant Design
  `notification.error` or `message.error`.

---

## 9. Testing

### Rule 35 — Component Test Mandate
- Every `ui/` component MUST have a corresponding test in `tests/unit/`.
- Tests use `@testing-library/react` and `vitest`.
- Tests MUST cover: default render, prop variations, and user interaction callbacks.

### Rule 36 — Hook Test Mandate
- Every custom hook in `hooks/` MUST have a unit test using `@testing-library/react`
  `renderHook`.
- Mock React Query and Jotai dependencies — never test against a live API in unit tests.

---

## 10. Accessibility

### Rule 37 — Semantic HTML
- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`, `<header>`,
  `<footer>`) for page structure.
- Never use `<div>` or `<span>` for interactive elements. Use `<button>` or `<a>`.

### Rule 38 — ARIA Labels
- All icon-only buttons MUST have an `aria-label`.
- All form inputs MUST have an associated `<label>` via Ant Design `Form.Item`'s `label` prop.

### Rule 55 — Enforced Accessibility Checklist
Every component shipped to production MUST pass the following checklist before the PR is merged. This reflects standards enforced by Apple, Stripe, and other professional-grade products.

**Keyboard navigation:**
- All interactive elements MUST be reachable via Tab key.
- Modal and drawer focus MUST be trapped inside the overlay while open.
- Escape MUST close all modals, drawers, and dropdowns.

**Screen reader support:**
- Dynamic content changes (loading states, success/error messages) MUST use aria-live regions or Ant Design's notification system so screen readers announce them.
- All images and icons that carry meaning MUST have alt text or `aria-label`. Decorative icons MUST have `aria-hidden="true"`.

**Color independence:**
- Never convey information by color alone. Every color-coded state (success, error, warning) MUST also have a text label, icon, or pattern accompanying it.

```ts
// ✅ Color + label
<Badge color="green" text="Active" />
```

**Motion:**
- Respect `prefers-reduced-motion`. Never use auto-playing animations on critical UI paths.
- Ant Design's animation can be globally reduced via `motionDuration: '0s'` in tokens.

---

*UI.md — Entix-App Frontend Standards*
*Established: 2026-04-01*
:::
