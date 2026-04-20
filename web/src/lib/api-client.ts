import { hc } from "hono/client";

/**
 * RPC client for the Worker API. Intentionally `any` at the chain root so:
 * - `tsc --noEmit -p tsconfig.app.json` does not resolve the full API type graph
 * - chained paths (`api.api.v1…`) typecheck; `hc<any>` alone yields a broken `ClientRequest` inference
 *
 * Narrow at call sites with `hcJson<T>(res)` (Phase I — UI.md / assessment §7.1 I).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiClient = any;

/**
 * Hono RPC client for the Cloudflare Worker API.
 * Same-origin requests with cookies; Vite dev proxies `/api` to wrangler.
 */
export function createApiClient(baseUrl?: string): ApiClient {
    const origin =
        baseUrl ??
        (typeof window !== "undefined" && window.location?.origin ? window.location.origin : "");

    return hc<any>(origin, {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
            fetch(input, {
                ...init,
                credentials: "include",
            }),
    }) as ApiClient;
}

let _client: ApiClient | undefined;

/** Singleton for hooks (avoids recreating hc on every render). */
export function getApiClient(): ApiClient {
    if (!_client) _client = createApiClient();
    return _client;
}
