import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000/api/v1/auth" // TODO: Use env var
});

export const { useSession, signIn, signUp, signOut } = authClient;