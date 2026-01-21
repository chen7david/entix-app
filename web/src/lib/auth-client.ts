import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [
        organizationClient(),
        adminClient(),
    ],
    basePath: '/api/v1/auth',
});

export const { useSession, signIn, signUp, signOut, sendVerificationEmail, verifyEmail } = authClient;