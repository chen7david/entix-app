import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import {
    authClient,
    changePassword,
    requestPasswordReset,
    resetPassword,
    sendVerificationEmail,
    signIn,
    signOut,
    signUp,
    useSession,
    verifyEmail,
} from "@web/src/lib/auth-client";
import { hcJson } from "@web/src/lib/hc-json";
import { STORAGE_KEYS } from "@web/src/lib/storageKeys";

export const useBetterAuth = () => {
    const session = useSession();
    return {
        session,
        isAuthenticated: !!session.data,
        isLoading: session.isPending,
        isSuperAdmin: session.data?.user?.role === "admin",
        refetch: session.refetch,
    };
};

export const useSignIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (values: { email: string; password: string }) => {
            const response = await signIn.email({
                email: values.email,
                password: values.password,
            });

            if (response.error) {
                throw new Error(response.error.message || "Failed to sign in");
            }

            return response;
        },
        onSuccess: () => {
            // Org query is gated on isAuthenticated so it won't fire until
            // AuthContext settles — this just ensures freshness after re-login.
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
    });
};

export const useSignUpWithOrg = () => {
    return useMutation({
        mutationFn: async (values: {
            email: string;
            password: string;
            name: string;
            organizationName: string;
        }) => {
            const api = getApiClient();
            const response = await api.api.v1.auth["signup-with-org"].$post({
                json: values,
            });

            return hcJson(response);
        },
    });
};

export const useSignUp = () => {
    return useMutation({
        mutationFn: async (values: { email: string; password: string; name: string }) => {
            const response = await signUp.email({
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
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await signOut();

            if (response.error) {
                throw new Error(response.error.message || "Failed to sign out");
            }

            // Force-clear org membership cache after sign-out to prevent stale RBAC data
            // during back-to-back sign-ins on the same browser session.
            try {
                await authClient.organization.setActive({ organizationId: null });
            } catch (e) {
                console.error("Failed to clear org membership cache during sign-out:", e);
            }

            return response;
        },
        onSuccess: () => {
            sessionStorage.removeItem(STORAGE_KEYS.lastOrgSlug);
            queryClient.clear();
        },
    });
};

export const useVerifyEmail = () => {
    return useMutation({
        mutationFn: async (values: { query: { token: string } }) => {
            const response = await verifyEmail({
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
            const response = await sendVerificationEmail({
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
            const response = await requestPasswordReset({
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
            const response = await resetPassword({
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
        mutationFn: async (values: {
            currentPassword: string;
            newPassword: string;
            revokeOtherSessions?: boolean;
        }) => {
            const response = await changePassword({
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

export const useStopImpersonating = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await authClient.admin.stopImpersonating();

            if (response.error) {
                throw new Error(response.error.message || "Failed to stop impersonation");
            }

            return response;
        },
        onSuccess: () => {
            // Force a deep reload to clear all contexts and fetch the correct user session
            window.location.href = "/admin/users";
        },
    });
};
