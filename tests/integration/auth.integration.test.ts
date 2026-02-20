import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import { createTestClient, type TestClient } from "../lib/test-client";
import { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";
import { mockMemberAddFailure } from "../lib/mock-errors";
import * as schema from "@api/db/schema.db";
import { eq } from "drizzle-orm";

describe("Auth Integration Test", () => {
    let client: TestClient;
    let db: ReturnType<typeof createTestDb> extends Promise<infer U> ? U : never;

    beforeEach(async () => {
        db = await createTestDb();
        client = createTestClient(app, env);
    });

    it("POST /api/v1/auth/signup-with-org should create user and organization", async () => {
        const payload = createMockSignUpWithOrgPayload();
        const res = await client.auth.signUpWithOrg(payload);

        expect(res.status).toBe(201);
        const body = await res.json() as SignUpWithOrgResponseDTO;

        expect(body).toHaveProperty("user");
        expect(body.user).toHaveProperty("id");
        expect(body.user.email).toBe(payload.email);
        expect(body.user.role).toBe("owner");

        expect(body).toHaveProperty("organization");
        expect(body.organization.name).toBe(payload.organizationName);
    });

    it("POST /api/v1/auth/signup-with-org should return error for existing user", async () => {
        const payload = createMockSignUpWithOrgPayload();

        // First request to create user
        const setupRes = await client.auth.signUpWithOrg(payload);
        expect(setupRes.status).toBe(201);

        // Second request with same user
        const res = await client.auth.signUpWithOrg(payload);

        expect(res.status).toBe(409);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("User already exists");
    });

    it("POST /api/v1/auth/signup-with-org should return error for existing organization", async () => {
        const payload1 = createMockSignUpWithOrgPayload();
        const payload2 = createMockSignUpWithOrgPayload();

        // Use same org name for both payloads
        payload2.organizationName = payload1.organizationName;

        // First request to create organization
        const setupRes = await client.auth.signUpWithOrg(payload1);
        expect(setupRes.status).toBe(201);

        // Second request with same organization name
        const res = await client.auth.signUpWithOrg(payload2);

        expect(res.status).toBe(409);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("Organization name already taken");
    });

    it("POST /api/v1/auth/signup-with-org should rollback user and organization atomically on setup failure", async () => {
        const payload = createMockSignUpWithOrgPayload();

        // Seed valid user and org to satisfy Foreign Key constraints
        await db.insert(schema.user).values({
            id: "dummy-user",
            name: "Dummy",
            email: "dummy@example.com",
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: "user",
            banned: false,
        });

        await db.insert(schema.organization).values({
            id: "dummy-org",
            name: "Dummy Org",
            slug: "dummy-org",
            createdAt: new Date(),
        });

        // Seed a member explicitly to trigger a UNIQUE constraint violation later
        await db.insert(schema.member).values({
            id: "pre-existing-conflict",
            organizationId: "dummy-org",
            userId: "dummy-user",
            role: "member",
            createdAt: new Date(),
        });

        // Mock the member repository `prepareAdd` to intentionally insert a conflicting 'id'
        const { MemberRepository } = await import("@api/repositories/member.repository");
        const { vi } = await import("vitest");
        const spy = vi.spyOn(MemberRepository.prototype, 'prepareAdd').mockImplementation(function () {
            const getDbClient = require("@api/factories/db.factory").getDbClient;
            return getDbClient((this as any).ctx).insert(schema.member).values({
                id: "pre-existing-conflict", // Will conflict
                organizationId: "dummy-org", // Must match foreign key
                userId: "dummy-user", // Must match foreign key 
                role: "owner",
                createdAt: new Date(),
            });
        });

        const res = await client.auth.signUpWithOrg(payload);

        // Ensure the handler caught the Drizzle batch error
        expect(res.status).toBe(500);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("Failed to setup organization, please try again");

        // Verify the user was NOT created (rolled back atomically)
        const user = await db.query.user.findFirst({
            where: eq(schema.user.email, payload.email)
        });
        expect(user).toBeUndefined();

        // Verify the organization was NOT created (rolled back atomically)
        const slug = payload.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const org = await db.query.organization.findFirst({
            where: eq(schema.organization.slug, slug)
        });
        expect(org).toBeUndefined();

        spy.mockRestore();
    });
});
