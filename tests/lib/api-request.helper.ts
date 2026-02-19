/**
 * Shared test utilities for API response handling.
 * 
 * NOTE: For making API requests, use createTestClient from ./test-client instead.
 */

/**
 * Type-safe JSON parser for test responses
 * Usage: const body = await parseJson<MyDTO>(response);
 */
export async function parseJson<T>(response: Response): Promise<T> {
    return await response.json() as T;
}

/**
 * Type for standard error response
 */
export type ErrorResponse = {
    success: false;
    message: string;
    details?: Record<string, unknown>;
};
