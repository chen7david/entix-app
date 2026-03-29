import { ac, admin, member, owner } from "@shared";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import type { AccessControl } from "better-auth/plugins/access";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    plugins: [
        organizationClient({
            ac: ac as AccessControl,
            roles: {
                admin,
                member,
                owner,
            },
        }),
        adminClient(),
    ],
    basePath: "/api/v1/auth",
    user: {
        additionalFields: {
            theme: { type: "string", required: false },
            timezone: { type: "string", required: false },
        },
    },
});

export const {
    useSession,
    signIn,
    signUp,
    signOut,
    sendVerificationEmail,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    changePassword,
} = authClient;
