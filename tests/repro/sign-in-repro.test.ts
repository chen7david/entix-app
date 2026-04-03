import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, it, expect } from "vitest";
import { auth } from "@api/lib/auth/auth";
import * as schema from "@shared/db/schema";

describe("Sign In Repro", () => {
    it("should sign in successfully with root admin", async () => {
        // Mock context
        const ctx = {
            env: {
                ...env,
                FRONTEND_URL: "http://localhost:3000",
                BETTER_AUTH_SECRET: "secret",
                SKIP_EMAIL_VERIFICATION: "false"
            },
            executionCtx: { waitUntil: () => {} },
            var: { frontendUrl: "http://localhost:3000" }
        } as any;

        const authInstance = auth(ctx);
        
        try {
            console.log("Attempting sign-in...");
            const response = await authInstance.api.signInEmail({
                body: {
                    email: "root@admin.com",
                    password: "root123"
                }
            });

            console.log("Sign In Success Response:", JSON.stringify(response, null, 2));
        } catch (error: any) {
            console.error("Sign In FAILED with error:", error);
            if (error.body) {
                console.error("Error body:", JSON.stringify(error.body, null, 2));
            }
            throw error;
        }
    });
});
