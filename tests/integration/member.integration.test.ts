import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { getAuthCookie, createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { parseJson, type ErrorResponse } from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";

describe("Member Creation Integration Tests", () => {
    let client: TestClient;
    let orgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("should create a member successfully", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(201);
        const body = await res.json() as CreateMemberResponseDTO;

        expect(body.user.email).toBe(payload.email);
        expect(body.member.role).toBe(payload.role);
    });

    it("should fail when user with email already exists", async () => {
        const payload = createMockMemberCreationPayload();

        // First request - should succeed
        await client.orgs.members.create(orgId, payload);

        // Second request with same email - should fail
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(409);
    });

    it("should fail when organization does not exist", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create("fake-id", payload);

        // Middleware checks membership before handler checks org existence
        // User is not a member of fake-id, so 403 is returned
        expect(res.status).toBe(403);
    });

    it("should create member with different role", async () => {
        const payload = createMockMemberCreationPayload({ role: "admin" });
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(201);
        const body = await res.json() as CreateMemberResponseDTO;
        expect(body.member.role).toBe("admin");
    });

    it("should fail when user lacks permission (unauthorized member)", async () => {
        // Create another user who is NOT in the original org
        const intruderCookie = await getAuthCookie({
            app,
            env,
            user: {
                email: "intruder@example.com",
                password: "Password123!",
                name: "Intruder"
            }
        });

        // Create a client for the intruder
        const intruderClient = createTestClient(app, env, intruderCookie);

        // Try to add member to the FIRST organization (should fail - not a member)
        const payload = createMockMemberCreationPayload();
        const res = await intruderClient.orgs.members.create(orgId, payload);

        expect(res.status).toBe(403);
        const body = await parseJson<ErrorResponse>(res);
        // Middleware now includes org ID in error message
        expect(body.message).toContain("You are not a member of organization");
    });
});
