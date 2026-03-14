import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { AppEnv } from "@api/helpers/types.helpers";

/**
 * Zod schema defining all required Cloudflare environment variables and secrets.
 * This guarantees the Edge Worker has all necessary configuration before handling any business logic.
 */
const envSchema = z.object({
    FRONTEND_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    RESEND_API_KEY: z.string().startsWith("re_", "RESEND_API_KEY must start with 're_'"),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(10, "CLOUDFLARE_ACCOUNT_ID is required"),
    R2_ACCESS_KEY_ID: z.string().min(10, "R2_ACCESS_KEY_ID is required"),
    R2_SECRET_ACCESS_KEY: z.string().min(10, "R2_SECRET_ACCESS_KEY is required"),
    R2_BUCKET_NAME: z.string().min(3, "R2_BUCKET_NAME is required"),
    PUBLIC_CDN_URL: z.string().url(),
    SKIP_EMAIL_VERIFICATION: z.enum(["true", "false", ""]).optional(),
    CORS_ORIGINS: z.string().optional(),
});

export const envValidatorMiddleware = () => {
    return createMiddleware<AppEnv>(async (c, next) => {
        const parsed = envSchema.safeParse(c.env);

        if (!parsed.success) {
            // Flatten the error to get exactly which keys are missing or invalid
            const flattened = parsed.error.flatten();
            
            // Format a highly visible error for the Cloudflare Dashboard logs
            const missingVars = Object.keys(flattened.fieldErrors).join(', ');
            
            // Ensure we log this massively critical error so it is impossible to miss during deployment
            if (c.var.logger) {
                c.var.logger.fatal({ errors: flattened.fieldErrors }, `🚨 [CRITICAL STARTUP ERROR] Missing or invalid environment variables: ${missingVars}`);
            } else {
                console.error(`🚨 [CRITICAL STARTUP ERROR] Missing or invalid environment variables: ${missingVars}`);
                console.error(flattened.fieldErrors);
            }

            // Immediately halt the request to prevent weird partial-failures downstream
            // We use a 500 status because this is a server misconfiguration, not a user error
            return c.json({
                success: false,
                message: "Internal Server Configuration Error",
                details: "The server is missing required infrastructure configuration and cannot boot safely."
            }, 500);
        }

        await next();
    });
};
