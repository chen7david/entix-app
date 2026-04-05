import type { SignUpWithOrgDTO } from "@shared/schemas/dto/auth.dto";
import type { Requester } from "./base-requester";

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

        /** POST /api/v1/auth/admin/resend-verification */
        resendVerification: (email: string) =>
            request("/api/v1/auth/admin/resend-verification", {
                method: "POST",
                body: { email },
            }),
    };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
