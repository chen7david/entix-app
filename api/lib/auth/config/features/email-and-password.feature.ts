import type { AppContext } from "@api/helpers/types.helpers";
import { MailService } from "@api/services/mailer.service";
import type { BetterAuthOptions } from "better-auth";
import { getUserRepository } from "@api/factories/repository.factory";
import { getFrontendUrl } from "@api/helpers/url.helpers";

export const getEmailAndPasswordConfig = (ctx?: AppContext, mailer?: MailService): Partial<BetterAuthOptions> => {
    const requireEmailVerification = ctx?.env.SKIP_EMAIL_VERIFICATION !== "true";

    return {
        emailAndPassword: {
            enabled: true,
            requireEmailVerification,
            async sendResetPassword({ user, token }) {
                if (!ctx || !mailer) return;

                const frontendUrl = getFrontendUrl(ctx);
                const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

                const emailPromise = !user.emailVerified
                    ? mailer.sendWelcomeEmailWithPasswordReset({
                        to: user.email,
                        displayName: user.name,
                        resetUrl,
                    })
                    : mailer.sendPasswordResetEmail({
                        to: user.email,
                        displayName: user.name,
                        resetUrl,
                    });

                ctx.executionCtx.waitUntil(emailPromise);
            },
            async onPasswordReset({ user }) {
                if (!ctx) return;

                ctx.var.logger.info({ userId: user.id, email: user.email }, "Password reset successful, ensuring email is verified");

                const userRepo = getUserRepository(ctx);
                await userRepo.updateUser(user.id, { emailVerified: true });
            },
        },
    };
};