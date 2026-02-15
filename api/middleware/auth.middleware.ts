import { HTTPException } from "hono/http-exception";
import { auth } from "@api/lib/auth/auth";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppContext } from "@api/helpers/types.helpers";

/**
 * Validates the user session and returns the user ID
 * Throws 401 if unauthorized
 */
export async function validateSession(c: AppContext): Promise<string> {
    const authClient = auth(c);
    const session = await authClient.api.getSession({ headers: c.req.raw.headers });

    if (!session || !session.user) {
        c.var.logger.warn("Unauthorized: No valid session");
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
            message: "Authentication required"
        });
    }

    // Set userId in context if needed, but returning it is safer for direct usage
    c.set("userId", session.user.id);
    return session.user.id;
}
