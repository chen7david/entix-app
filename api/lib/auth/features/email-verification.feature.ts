import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../mail/mailer.lib";
import { BetterAuthOptions } from "better-auth";

export const getEmailVerificationConfig = (ctx: AppContext, mailer: Mailer): Partial<BetterAuthOptions> => ({
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }) => {
            const verificationUrl = `${ctx.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
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
});
