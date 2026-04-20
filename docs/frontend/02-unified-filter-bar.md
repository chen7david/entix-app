# Unified Filter Bar

This guide defines how to build scalable filters with the shared `FilterBar` and `DataTableWithFilters` primitives.

## Goals

- Keep filter UX consistent across pages.
- Prevent duplicated one-off filter logic.
- Avoid accidental over-fetching from repeated `useEffect`/URL updates.
- Support page-specific behavior through adapters/plugins, not forks.

## Core Components

- `web/src/components/data/FilterBar.tsx`
  - Generic UI renderer for `search`, `select`, `segmented`, and `dateRange` controls.
  - Supports dynamic visibility (`visibleWhen`), disabled rules (`disabledWhen`), and `customRender`.
- `web/src/components/data/DataTableWithFilters.tsx`
  - Composes `FilterBar` with table + pagination.
  - Handles local filter state, reset wiring, and forwards filter changes to page hooks.

## Standard Placement Rule

- If a page has summary/metric cards, place the filter bar **immediately below cards**.
- If no summary cards exist, place the filter bar above the data surface it controls.
- Keep the order consistent across pages:
  1. Header/title
  2. Summary cards
  3. Filter bar
  4. Table/charts/content

## Reset Behavior Standard

- Reset appears only when current values differ from `initialValues`.
- Keep layout stable by reserving reset button space even when hidden.
- Every page should provide deterministic `initialValues` and `onReset`.

## Building a Plugin/Adapter

Use adapters for domain logic (preset/date mapping, payload transforms) and keep `FilterBar` declarative.

### 1) Adapter (domain mapping)

Use `web/src/components/data/filter-bar/datePresetAdapter.ts` for preset-based date filters:

- `getPresetFromRange(...)`
- `getRangeFromPreset(...)`
- `toIsoRange(...)`

This keeps date logic reusable and testable.

### 2) Plugin (`customRender`)

When built-in filter types are not enough, use `customRender` in `FilterConfig`:

- Keep plugin components small and focused.
- Accept current values + update methods from `FilterBar`.
- Avoid direct data fetching from plugin controls.

## Avoiding "Too Many Calls" / Effect Loops

- Never call fetch mutations directly in render.
- In filter handlers, guard no-op updates before calling setters/router updates.
- For URL-backed filters:
  - Compare next params against current params and return early if unchanged.
  - Use deterministic serialization (`toISOString` for date values).
- Keep `useEffect` dependencies explicit and value-based (not unstable object/function references).

## Migration Checklist

- Replace page-local filter controls with `FilterBar` or `DataTableWithFilters`.
- Move filter bar below metric cards when cards exist.
- Define stable `initialValues` constants.
- Verify reset semantics and cursor/pagination resets.
- Add or update tests for:
  - payload mapping
  - reset behavior
  - URL sync behavior (if applicable)

