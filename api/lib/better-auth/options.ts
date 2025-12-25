import { BetterAuthOptions } from 'better-auth';
import { createEmailService } from '@api/services/email.service';

export const betterAuthOptions: Partial<BetterAuthOptions> = {
    appName: 'entix-app',
    basePath: '/api/v1/auth',
};

/**
 * Get Better Auth options with email configuration
 * This function is called at runtime with environment bindings
 */
export const getBetterAuthOptions = (env: CloudflareBindings): Partial<BetterAuthOptions> => {
    const emailService = createEmailService(env);

    return {
        ...betterAuthOptions,
        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url }, request) => {
                // Use void to prevent timing attacks as recommended by Better Auth
                void emailService.sendVerificationEmail({
                    to: user.email,
                    userName: user.name,
                    verificationUrl: url,
                });
            },
        },
        emailAndPassword: {
            enabled: true,
            sendResetPassword: async ({ user, url }, request) => {
                // Use void to prevent timing attacks as recommended by Better Auth
                void emailService.sendPasswordResetEmail({
                    to: user.email,
                    userName: user.name,
                    resetUrl: url,
                });
            },
            resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
        },
    };
};