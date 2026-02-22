import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";
import type { AccessControl } from "better-auth/plugins/access";

import { ac, admin, member, owner } from "@shared/auth/permissions";

export const authClient = createAuthClient({
    plugins: [
        organizationClient({
            ac: ac as AccessControl,
            roles: {
                admin,
                member,
                owner,
            }
        }),
        adminClient(),
    ],
    basePath: '/api/v1/auth',
});

export const { useSession, signIn, signUp, signOut, sendVerificationEmail, verifyEmail, requestPasswordReset, resetPassword, changePassword } = authClient;