/**
 * Standard utility for parsing API error responses from the Hono/Cloudflare backend.
 * Prioritizes the 'message' field from our globalErrorHandler response envelope.
 *
 * @param res - The fetch Response object
 * @throws {Error} An error with the message from the backend or a status-based fallback
 */
export async function parseApiError(res: Response): Promise<never> {
    try {
        const body = (await res.json()) as { message?: string; error?: string };
        // Default to the standardized 'message' or 'error' key, then fallback to status text
        const errorMessage =
            body.message || body.error || `Request failed with status ${res.status}`;
        throw new Error(errorMessage);
    } catch (e) {
        // If it was already an Error from the try block, re-throw it
        if (e instanceof Error) throw e;
        // Fallback for non-JSON or other parsing errors
        throw new Error(`Request failed with status ${res.status}`);
    }
}
