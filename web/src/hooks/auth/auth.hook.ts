import { authClient } from "@web/src/lib/auth-client";

export const useAuth = () => {
    const session = authClient.useSession();

    const signIn = async (email: string, password: string) => {
        return await authClient.signIn.email({
            email,
            password,
        });
    };

    const signUp = async (email: string, password: string, name: string) => {
        return await authClient.signUp.email({
            email,
            password,
            name,
        });
    };

    const signOut = async () => {
        return await authClient.signOut();
    };

    return {
        session,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!session.data,
        isLoading: session.isPending,
    };
};
