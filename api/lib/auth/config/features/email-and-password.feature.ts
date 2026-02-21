import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../../mail/mailer.lib";
import { BetterAuthOptions } from "better-auth";
import { UserRepository } from "@api/repositories/user.repository";

export const getEmailAndPasswordConfig = (ctx?: AppContext, mailer?: Mailer): Partial<BetterAuthOptions> => {
    // Disable email verification requirement in tests
    const requireEmailVerification = ctx?.env.SKIP_EMAIL_VERIFICATION !== "true";

    return {
        emailAndPassword: {
            enabled: true,
            requireEmailVerification,
            async sendResetPassword({ user, token }) {
                if (!ctx || !mailer) return;
                const resetUrl = `${ctx.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
                ctx.executionCtx.waitUntil(
                    mailer.sendTemplate({
                        to: user.email,
                        templateId: "reset-password",
                        variables: {
                            DISPLAY_NAME: user.name,
                            RESET_LINK: resetUrl,
                        },
                    })
                );
            },
            async onPasswordReset({ user }) {
                if (!ctx) return;

                ctx.var.logger.info({ userId: user.id, email: user.email }, "Password reset successful, ensuring email is verified");

                const userRepo = new UserRepository(ctx);
                await userRepo.updateUser(user.id, { emailVerified: true });
            },
        },
    };
};