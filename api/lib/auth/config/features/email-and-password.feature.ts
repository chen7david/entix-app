import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../../mail/mailer.lib";
import { BetterAuthOptions } from "better-auth";

export const getEmailAndPasswordConfig = (ctx?: AppContext, mailer?: Mailer): Partial<BetterAuthOptions> => {
    // Disable email verification requirement in tests
    const requireEmailVerification = ctx?.env.SKIP_EMAIL_VERIFICATION !== "true";

    return {
        emailAndPassword: {
            enabled: true,
            requireEmailVerification,
            sendResetPassword: async ({ user, url, token }) => {
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
        },
    };
};