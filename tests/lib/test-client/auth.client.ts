import type { Requester } from "./base-requester";
import type { SignUpWithOrgDTO } from "@shared/schemas/dto/auth.dto";

/**
 * Auth API test client.
 * Covers unauthenticated auth endpoints.
 */
export function createAuthClient(request: Requester) {
    return {
        /** POST /api/v1/auth/signup-with-org */
        signUpWithOrg: (payload: SignUpWithOrgDTO) =>
            request("/api/v1/auth/signup-with-org", { method: "POST", body: payload }),

        /** POST /api/v1/auth/sign-in/email */
        signIn: (email: string, password: string) =>
            request("/api/v1/auth/sign-in/email", {
                method: "POST",
                body: { email, password },
            }),
    };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
