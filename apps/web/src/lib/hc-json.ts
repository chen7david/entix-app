import { parseApiError } from "@web/src/utils/api";

/** Parse JSON from an `hc` `Response` after the same error handling as raw `fetch` + `parseApiError`. */
export async function hcJson<T>(res: Response): Promise<T> {
    if (!res.ok) await parseApiError(res);
    return (await res.json()) as T;
}
