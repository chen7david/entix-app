import { describe, it, expect, beforeEach } from "vitest";
import app from "../../api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { getAuthCookie, createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import {
    authenticatedPost,
    unauthenticatedPost,
    parseJson,
    type ErrorResponse
} from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";

describe("Organization Membership Middleware Tests", () => {
    let orgId: string;
    let sessionCookie: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        sessionCookie = cookie;
        orgId = id;
    });

    it("should allow access when user is a member", async () => {
        // User created org in beforeEach, so they're a member
        const payload = createMockMemberCreationPayload();
        const res = await authenticatedPost({
            app,
            env,
            path: `/api/v1/organizations/${orgId}/members`,
            body: payload,
            cookie: sessionCookie
        });

        // Should succeed (user is owner of org)
        expect(res.status).toBe(200);
    });

    it("should return 403 when user is not a member", async () => {
        // Create second user with their own org
        const intruderCookie = await getAuthCookie({
            app,
            env,
            user: {
                email: "intruder@example.com",
                password: "Password123!",
                name: "Intruder"
            }
        });

        // Second user tries to access first org's resources
        const payload = createMockMemberCreationPayload();
        const res = await authenticatedPost({
            app,
            env,
            path: `/api/v1/organizations/${orgId}/members`,
            body: payload,
            cookie: intruderCookie
        });

        expect(res.status).toBe(403);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
        expect(body.message).toContain("You are not a member of organization");
        expect(body.message).toContain(orgId);
    });

    it("should return 401 when not authenticated", async () => {
        // Try to access without session token
        const payload = createMockMemberCreationPayload();
        const res = await unauthenticatedPost({
            app,
            env,
            path: `/api/v1/organizations/${orgId}/members`,
            body: payload
        });

        expect(res.status).toBe(401);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
        expect(body.message).toBe("Authentication required");
    });

    it("should handle non-existent organization gracefully", async () => {
        // Try to access a fake org
        const payload = createMockMemberCreationPayload();
        const res = await authenticatedPost({
            app,
            env,
            path: `/api/v1/organizations/fake-org-id/members`,
            body: payload,
            cookie: sessionCookie
        });

        // Middleware checks membership before handler checks org existence
        // So this returns 403 (not a member) instead of 404 (org not found)
        expect(res.status).toBe(403);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.message).toContain("You are not a member of organization");
    });

    it("should verify middleware sets context correctly", async () => {
        // Create a member successfully using the handler
        const payload = createMockMemberCreationPayload();
        const res = await authenticatedPost({
            app,
            env,
            path: `/api/v1/organizations/${orgId}/members`,
            body: payload,
            cookie: sessionCookie
        });

        expect(res.status).toBe(200);

        // If handler successfully created member, it means middleware provided:
        // - userId (from requireAuth)
        // - organizationId (from requireOrgMembership)
        // - membershipRole (from requireOrgMembership)
        const body = await parseJson<CreateMemberResponseDTO>(res);
        expect(body.member).toBeDefined();
        expect(body.member.organizationId).toBe(orgId);
    });
});
