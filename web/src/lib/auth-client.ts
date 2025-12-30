import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: `${import.meta.env.VITE_BETTER_AUTH_URL}/api/v1/auth`,
});

export const { useSession, signIn, signUp, signOut } = authClient;