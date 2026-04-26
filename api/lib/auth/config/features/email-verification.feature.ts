import type { AppContext } from "@api/helpers/types.helpers";
import type { MailService } from "@api/services/mailer.service";
import type { BetterAuthOptions } from "better-auth";

export const getEmailVerificationConfig = (
    ctx?: AppContext,
    mailer?: MailService
): Partial<BetterAuthOptions> => {
    if ((ctx?.env.SKIP_EMAIL_VERIFICATION as string) === "true") {
        return {};
    }

    return {
        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
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
            },
        },
    };
};
