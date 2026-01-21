import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../../mail/mailer.lib";
import { BetterAuthOptions } from "better-auth";

export const getEmailAndPasswordConfig = (ctx?: AppContext, mailer?: Mailer): Partial<BetterAuthOptions> => ({
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            if (!ctx || !mailer) return;
            ctx.executionCtx.waitUntil(
                mailer.sendTemplate({
                    to: user.email,
                    templateId: "reset-password",
                    variables: {
                        DISPLAY_NAME: user.name,
                        RESET_LINK: url,
                    },
                })
            );
        },
        onPasswordReset: async ({ user }) => {
            console.log(`Password for user ${user.email} has been reset.`);
        },
    },
});