/**
 * Explicit React Query `staleTime` values (UI.md — do not rely only on global defaults).
 * Keep in sync with `App.tsx` `QueryClient` defaults where values match.
 */

/** Org-scoped lists, admin lists, wallet/finance views — 5 minutes */
export const QUERY_STALE_MS = 1000 * 60 * 5;

/** Dashboard-style aggregates (charts, session summaries) — 2 minutes */
export const QUERY_STALE_ANALYTICS_MS = 120_000;

/** Org currency catalog / rarely edited configuration — 24 hours */
export const QUERY_STALE_CATALOG_MS = 1000 * 60 * 60 * 24;

/** Global reference data (e.g. social media types) — 1 hour */
export const QUERY_STALE_REFERENCE_MS = 1000 * 60 * 60;
