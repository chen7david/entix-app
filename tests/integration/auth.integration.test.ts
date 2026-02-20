import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import { createTestClient, type TestClient } from "../lib/test-client";
import { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";
import { mockMemberAddFailure } from "../lib/mock-errors";
import { getDbClient } from "@api/factories/db.factory";
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

    it("POST /api/v1/auth/signup-with-org should rollback user and organization on setup failure", async () => {
        const payload = createMockSignUpWithOrgPayload();

        // Mock the member repository to fail
        mockMemberAddFailure();

        const res = await client.auth.signUpWithOrg(payload);

        // Ensure the handler correctly caught and rolled it back
        expect(res.status).toBe(500);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("Failed to setup organization, please try again");

        // Verify the user was deleted
        const user = await db.query.user.findFirst({
            where: eq(schema.user.email, payload.email)
        });
        expect(user).toBeUndefined();

        // Verify the organization was deleted
        const slug = payload.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const org = await db.query.organization.findFirst({
            where: eq(schema.organization.slug, slug)
        });
        expect(org).toBeUndefined();
    });
});
