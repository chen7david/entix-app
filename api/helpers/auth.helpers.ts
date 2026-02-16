import type { AppContext } from "./types.helpers";
import { UnauthorizedError } from "@api/errors/app.error";

/**
 * Get the authenticated user ID from context
 * Must be called after requireAuth middleware
 * 
 * @param c - Request context
 * @returns User ID (guaranteed non-null after requireAuth middleware)
 * @throws UnauthorizedError if userId not found in context
 */
export function getAuthenticatedUserId(c: AppContext): string {
    const userId = c.get("userId");

    if (!userId) {
        // This should never happen if requireAuth middleware ran correctly
        c.var.logger.error("userId not found in context after auth middleware");
        throw new UnauthorizedError("Authentication required");
    }

    return userId;
}
