import { env } from "cloudflare:test";
import app from "@api/app";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { type ErrorResponse, parseJson } from "../lib/api-request.helper";
import { createAuthenticatedOrg, getAuthCookie } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Organization Membership Middleware Tests", () => {
    let client: TestClient;
    let orgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("should allow access when user is a member", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(201);
    });

    it("should return 403 when user is not a member", async () => {
        const intruderCookie = await getAuthCookie({
            app,
            env,
            user: {
                email: "intruder@example.com",
                password: "Password123!",
                name: "Intruder",
            },
        });

        const intruderClient = createTestClient(app, env, intruderCookie);
        const payload = createMockMemberCreationPayload();
        const res = await intruderClient.orgs.members.create(orgId, payload);

        expect(res.status).toBe(403);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
        expect(body.message).toContain("You are not a member of organization");
        expect(body.message).toContain(orgId);
    });

    it("should return 401 when not authenticated", async () => {
        const unauthClient = createTestClient(app, env);
        const payload = createMockMemberCreationPayload();
        const res = await unauthClient.orgs.members.create(orgId, payload);

        expect(res.status).toBe(401);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
        expect(body.message).toBe("Authentication required");
    });

    it("should handle non-existent organization gracefully", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create("fake-org-id", payload);

        expect(res.status).toBe(403);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.message).toContain("You are not a member of organization");
    });

    it("should verify middleware sets context correctly", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(201);

        const body = await parseJson<CreateMemberResponseDTO>(res);
        expect(body.data.member).toBeDefined();
        expect(body.data.member.organizationId).toBe(orgId);
    });
});
