import { describe, it, expect, beforeEach } from "vitest";
import app from "../../api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";

interface SignUpWithOrgResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    organization: {
        id: string;
        name: string;
        slug: string;
    };
}

describe("Member Creation Integration Tests", () => {
    let orgId: string;

    beforeEach(async () => {
        await createTestDb();

        // Create an organization first
        const orgPayload = createMockSignUpWithOrgPayload();
        const orgRes = await app.request("/api/v1/auth/signup-with-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orgPayload),
        }, env);

        const orgData = await orgRes.json() as SignUpWithOrgResponse;
        orgId = orgData.organization.id;
    });

    it("should create a member successfully", async () => {
        const payload = createMockMemberCreationPayload();

        const res = await app.request(`/api/v1/organizations/${orgId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);

        expect(res.status).toBe(200);
        const body = await res.json() as CreateMemberResponseDTO;

        expect(body.user.email).toBe(payload.email);
        expect(body.user.name).toBe(payload.name);
        expect(body.member.role).toBe(payload.role);
        expect(body.member.organizationId).toBe(orgId);
        expect(body.member.userId).toBe(body.user.id);
    });

    it("should fail when user with email already exists", async () => {
        const payload = createMockMemberCreationPayload();

        // First request - should succeed
        await app.request(`/api/v1/organizations/${orgId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);

        // Second request with same email - should fail
        const res = await app.request(`/api/v1/organizations/${orgId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);

        expect(res.status).toBe(400);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("User with this email already exists");
    });

    it("should fail when organization does not exist", async () => {
        const payload = createMockMemberCreationPayload();

        const res = await app.request(`/api/v1/organizations/fake-org-id/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);

        expect(res.status).toBe(404);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("Organization not found");
    });

    it("should create member with different role", async () => {
        const payload = createMockMemberCreationPayload({ role: "admin" });

        const res = await app.request(`/api/v1/organizations/${orgId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);

        expect(res.status).toBe(200);
        const body = await res.json() as CreateMemberResponseDTO;

        expect(body.member.role).toBe("admin");
    });
});
