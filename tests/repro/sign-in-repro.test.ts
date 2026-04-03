import { env } from "cloudflare:test";
import { auth } from "@api/lib/auth/auth";
import * as schema from "@shared/db/schema";
import { hashPassword } from "better-auth/crypto";
import { beforeEach, describe, it } from "vitest";
import { createTestDb } from "../lib/utils";

describe("Sign In Repro", () => {
    beforeEach(async () => {
        const db = await createTestDb();
        const rootId = "TiD38FfFP9TXbiDAdin6hi5oZjJzu3UK";
        const orgId = "A6xj7krOIJ3n9uHiipspC";
        const accountId = "AgQUkeQr8EQVxrJy02ypz7qCMpBWhslp";
        const now = new Date();
        const password = await hashPassword("root123");

        // Seed Root User
        await db
            .insert(schema.authUsers)
            .values({
                id: rootId,
                xid: "ROOTADMIN",
                name: "Root Admin",
                email: "root@admin.com",
                emailVerified: true,
                role: "admin",
                createdAt: now,
                updatedAt: now,
            })
            .onConflictDoNothing();

        // Seed Org
        await db
            .insert(schema.authOrganizations)
            .values({
                id: orgId,
                name: "Test Org",
                slug: "testorg",
                createdAt: now,
            })
            .onConflictDoNothing();

        // Seed Auth Account (Hashed 'root123')
        await db
            .insert(schema.authAccounts)
            .values({
                id: accountId,
                accountId: "root@admin.com",
                providerId: "credential",
                userId: rootId,
                password,
                createdAt: now,
                updatedAt: now,
            })
            .onConflictDoNothing();

        // Seed Org Membership
        await db
            .insert(schema.authMembers)
            .values({
                id: "E2QTyceWPwpj-n_1I5lyR",
                organizationId: orgId,
                userId: rootId,
                role: "owner",
                createdAt: now,
            })
            .onConflictDoNothing();
    });

    it("should sign in successfully with root admin", async () => {
        // Mock context
        const ctx = {
            env: {
                ...env,
                FRONTEND_URL: "http://localhost:3000",
                BETTER_AUTH_SECRET: "a1ed073fe5e6f1b799d4b0d307e44822",
                SKIP_EMAIL_VERIFICATION: "false",
            },
            executionCtx: { waitUntil: () => {} },
            var: { frontendUrl: "http://localhost:3000" },
        } as any;

        const authInstance = auth(ctx);

        try {
            console.log("Attempting sign-in...");
            const response = await authInstance.api.signInEmail({
                body: {
                    email: "root@admin.com",
                    password: "root123",
                },
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
