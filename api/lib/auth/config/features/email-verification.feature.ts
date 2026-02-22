import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../../mail/mailer.lib";
import { BetterAuthOptions } from "better-auth";

export const getEmailVerificationConfig = (ctx?: AppContext, mailer?: Mailer): Partial<BetterAuthOptions> => {
    // Skip email verification if the environment variable is set (for tests)
    if (ctx?.env.SKIP_EMAIL_VERIFICATION === "true") {
        return {};
    }

    return {
        emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, token }) => {
                if (!ctx || !mailer) return;

                const verificationUrl = `${ctx.var.frontendUrl}/auth/verify-email?token=${token}`;
                ctx.executionCtx.waitUntil(
                    mailer.sendTemplate({
                        to: user.email,
                        templateId: "email-verification",
                        variables: {
                            DISPLAY_NAME: user.name,
                            VERIFICATION_LINK: verificationUrl,
                        },
                    })
                );
            }
        },
    };
};
