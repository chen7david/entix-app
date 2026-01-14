import { authClient } from "@web/src/lib/auth-client";
import { useMutation } from "@tanstack/react-query";

export const useAuth = () => {
    const session = authClient.useSession();
    return {
        session,
        isAuthenticated: !!session.data,
        isLoading: session.isPending,
    };
};

export const useSignIn = () => {
    return useMutation({
        mutationFn: async (values: { email: string; password: string }) => {
            const response = await authClient.signIn.email({
                email: values.email,
                password: values.password,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to sign in");
            }

            return response;
        },
    });
};

export const useSignUp = () => {
    return useMutation({
        mutationFn: async (values: { email: string; password: string; name: string }) => {
            const response = await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to sign up");
            }

            return response;
        },
    });
};

export const useSignOut = () => {
    return useMutation({
        mutationFn: async () => {
            return await authClient.signOut();
        },
    });
};

export const useVerifyEmail = () => {
    return useMutation({
        mutationFn: async (values: { query: { token: string } }) => {
            return await authClient.verifyEmail({
                query: values.query,
            });
        },
    });
};

export const useResendVerification = () => {
    return useMutation({
        mutationFn: async (values: { email: string }) => {
            return await authClient.sendVerificationEmail({
                email: values.email,
            });
        },
    });
};
