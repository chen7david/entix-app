import { env } from "cloudflare:test";
import app from "@api/app";
import { seedFinancials } from "@api/db/seed/financial.seed";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../lib/utils";

describe("Auth Sign-In 500 Reproduction", () => {
    beforeEach(async () => {
        // 1. Reset Database
        await createTestDb();

        // 2. Perform same seeding as manual app
        const db = drizzle(env.DB);
        await seedFinancials(db as any);
    });

    it("POST /api/v1/auth/sign-in/email should return 200, not 500", async () => {
        const credentials = {
            email: "repro@example.com",
            password: "Password123!",
            name: "Repro User",
        };

        // 1. Sign up
        const signUpRes = await app.request(
            "/api/v1/auth/sign-up/email",
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(credentials),
            },
            env
        );
        expect(signUpRes.status).toBe(200);

        // 2. Sign in (this is the reported 500)
        const signInRes = await app.request(
            "/api/v1/auth/sign-in/email",
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                }),
            },
            env
        );

        if (signInRes.status === 500) {
            const body = await signInRes.text();
            console.error("🔴 Captured 500 Error Body:", body);
        }

        expect(signInRes.status).toBe(200);
    });

    it("POST /api/v1/auth/sign-in/email should handle multiple attempts without 500", async () => {
        const email = "repro2@example.com";
        const password = "Password123!";

        // Sign up
        await app.request(
            "/api/v1/auth/sign-up/email",
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password, name: "User 2" }),
            },
            env
        );

        // Sign in twice
        for (let i = 0; i < 2; i++) {
            const res = await app.request(
                "/api/v1/auth/sign-in/email",
                {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email, password }),
                },
                env
            );
            expect(res.status).toBe(200);
        }
    });
});
