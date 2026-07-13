/**
 * Standard utility for parsing API error responses from the Hono/Cloudflare backend.
 * Prioritizes the 'message' field from our globalErrorHandler response envelope.
 *
 * @param res - The fetch Response object
 * @throws {Error} An error with the message from the backend or a status-based fallback
 */
export async function parseApiError(res: Response): Promise<never> {
    try {
        const body = (await res.json()) as {
            message?: string;
            error?: string;
            details?: unknown;
        };
        const baseMessage =
            body.message || body.error || `Request failed with status ${res.status}`;
        const detailSummary = summarizeValidationDetails(body.details);
        throw new Error(detailSummary ? `${baseMessage}: ${detailSummary}` : baseMessage);
    } catch (e) {
        // If it was already an Error from the try block, re-throw it
        if (e instanceof Error) throw e;
        // Fallback for non-JSON or other parsing errors
        throw new Error(`Request failed with status ${res.status}`);
    }
}

function summarizeValidationDetails(details: unknown, limit = 3): string | null {
    if (!details) return null;

    const messages: string[] = [];
    const visit = (value: unknown, path = "") => {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) {
            for (const entry of value) {
                if (typeof entry === "string") {
                    messages.push(path ? `${path}: ${entry}` : entry);
                } else {
                    visit(entry, path);
                }
            }
            return;
        }

        const record = value as Record<string, unknown>;
        if (Array.isArray(record.errors)) {
            for (const entry of record.errors) {
                if (typeof entry === "string") {
                    messages.push(path ? `${path}: ${entry}` : entry);
                }
            }
        }
        for (const [key, child] of Object.entries(record)) {
            if (key === "errors") continue;
            visit(child, path ? `${path}.${key}` : key);
        }
    };

    visit(details);
    if (messages.length === 0) {
        try {
            return JSON.stringify(details).slice(0, 240);
        } catch {
            return null;
        }
    }
    const shown = messages.slice(0, limit);
    const remaining = messages.length - shown.length;
    return remaining > 0 ? `${shown.join("; ")} (+${remaining} more)` : shown.join("; ");
}
