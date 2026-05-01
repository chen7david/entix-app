import { env } from "cloudflare:test";
import app from "@api/app";
import * as schema from "@shared/db/schema";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSuperAdmin, getAuthCookie } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Admin Verification Resend Integration", () => {
    beforeEach(async () => {
        await createTestDb();
        // Clear mocks before each test
        vi.restoreAllMocks();
    });

    it("POST /api/v1/auth/admin/resend-verification should succeed for super admin", async () => {
        // 1. Setup: Create a regular user who is UNVERIFIED
        const targetEmail = "unverified@example.com";
        const db = drizzle(env.DB, { schema });

        // Mock the service method to avoid Better Auth "email not enabled" errors in test env
        const { NotificationService } = await import("@api/services/notification.service");
        const spy = vi
            .spyOn(NotificationService.prototype, "sendVerificationReminder")
            .mockResolvedValue(undefined);

        await db.insert(schema.authUsers).values({
            id: "target-user-id",
            name: "Unverified User",
            email: targetEmail,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: "user",
            banned: false,
        });

        // 2. Auth: Create a Super Admin
        const { cookie } = await createSuperAdmin({ app, env });
        const client = createTestClient(app, env, cookie);

        // 3. Act
        const res = await client.auth.resendVerification(targetEmail);

        // 4. Assert
        expect(res.status).toBe(200);
        expect(spy).toHaveBeenCalledWith(targetEmail);
    });

    it("POST /api/v1/auth/admin/resend-verification should fail for non-admin user", async () => {
        // 1. Setup: Create a regular user who is UNVERIFIED
        const targetEmail = "unverified@example.com";

        // 2. Auth: Create a regular user session (NOT super admin)
        const regularCookie = await getAuthCookie({
            app,
            env,
            user: {
                email: "regular@example.com",
                password: "Password123!",
                name: "Regular User",
            },
        });
        const client = createTestClient(app, env, regularCookie);

        // 3. Act
        const res = await client.auth.resendVerification(targetEmail);

        // 4. Assert
        expect(res.status).toBe(403); // Forbidden by requireSuperAdmin middleware
    });

    it("POST /api/v1/auth/admin/resend-verification should fail for unauthenticated request", async () => {
        const targetEmail = "unverified@example.com";

        // 1. Auth: No cookie
        const client = createTestClient(app, env);

        // 2. Act
        const res = await client.auth.resendVerification(targetEmail);

        // 3. Assert
        expect(res.status).toBe(401); // Unauthorized by requireAuth middleware
    });
});
