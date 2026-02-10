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


export const useSignUpWithOrg = () => {
    return useMutation({
        mutationFn: async (values: { email: string; password: string; name: string; organizationName: string }) => {
            const response = await fetch("/api/v1/auth/signup-with-org", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to sign up");
            }

            return response.json();
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
            const response = await authClient.signOut();

            if (response.error) {
                throw new Error(response.error.message || "Failed to sign out");
            }

            return response;
        },
    });
};

export const useVerifyEmail = () => {
    return useMutation({
        mutationFn: async (values: { query: { token: string } }) => {
            const response = await authClient.verifyEmail({
                query: values.query,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to verify email");
            }

            return response;
        },
    });
};

export const useResendVerification = () => {
    return useMutation({
        mutationFn: async (values: { email: string }) => {
            const response = await authClient.sendVerificationEmail({
                email: values.email,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to send verification email");
            }

            return response;
        },
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: async (values: { email: string; redirectTo?: string }) => {
            const response = await authClient.requestPasswordReset({
                email: values.email,
                redirectTo: values.redirectTo,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to send password reset email");
            }

            return response;
        },
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: async (values: { newPassword: string; token: string }) => {
            const response = await authClient.resetPassword({
                newPassword: values.newPassword,
                token: values.token,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to reset password");
            }

            return response;
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: async (values: { currentPassword: string; newPassword: string; revokeOtherSessions?: boolean }) => {
            const response = await authClient.changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                revokeOtherSessions: values.revokeOtherSessions,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to change password");
            }

            return response;
        },
    });
};
