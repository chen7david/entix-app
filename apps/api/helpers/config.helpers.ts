import { z } from "zod";

const envSchema = z.object({
    FRONTEND_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    // Add other env vars here as needed
});

/**
 * Validates and returns the environment configuration.
 * Using a function to ensure it uses the latest process.env (important for some edge environments).
 */
export const getEnvConfig = () => {
    return envSchema.parse(process.env);
};
