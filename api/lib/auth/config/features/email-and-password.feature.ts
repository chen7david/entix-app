import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../../mail/mailer.lib";
import { BetterAuthOptions } from "better-auth";

export const getEmailAndPasswordConfig = (ctx?: AppContext, mailer?: Mailer): Partial<BetterAuthOptions> => ({
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }) => {
            if (!ctx || !mailer) return;

            // Construct frontend reset URL instead of using backend API URL
            // The 'url' parameter from BetterAuth points to the backend API
            // We want users to go directly to the frontend with the token as a query param
            const frontendResetUrl = `${ctx.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

            ctx.executionCtx.waitUntil(
                mailer.sendTemplate({
                    to: user.email,
                    templateId: "reset-password",
                    variables: {
                        DISPLAY_NAME: user.name,
                        RESET_LINK: frontendResetUrl, // Use frontend URL, not backend API URL
                    },
                })
            );
        },
        onPasswordReset: async ({ user }) => {
            console.log(`Password for user ${user.email} has been reset.`);
        },
    },
});