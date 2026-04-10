import { env } from "cloudflare:test";
import app from "@api/app";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { type ErrorResponse, parseJson } from "../lib/api-request.helper";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("Permission-Based Authorization Tests", () => {
    let ownerClient: TestClient;
    let ownerOrgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        ownerClient = createTestClient(app, env, cookie);
        ownerOrgId = orgId;
    });

    describe("Owner permissions", () => {
        it("owner should be able to create a member (has member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await ownerClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.data.user.email).toBe(payload.email);
        });
    });

    describe("Admin permissions", () => {
        let adminClient: TestClient;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "admin",
                email: `admin.${Date.now()}@example.com`,
            });
            adminClient = createTestClient(app, env, result.cookie);
        });

        it("admin should be able to create a member (has member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await adminClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.data.user.email).toBe(payload.email);
        });
    });

    describe("Student permissions", () => {
        let studentClient: TestClient;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "student",
                email: `student.${Date.now()}@example.com`,
            });
            studentClient = createTestClient(app, env, result.cookie);
        });

        it("regular student should NOT be able to create a member (lacks member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await studentClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.success).toBe(false);
        });

        it("should return a meaningful permission error message", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await studentClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.message).toBeDefined();
        });
    });

    describe("Multi-role permissions (comma-separated)", () => {
        let multiRoleClient: TestClient;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "student, admin",
                email: `multirole.${Date.now()}@example.com`,
            });
            multiRoleClient = createTestClient(app, env, result.cookie);
        });

        it("should grant access if at least ONE of the user's comma-separated roles has the permission", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await multiRoleClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.data.user.email).toBe(payload.email);
        });
    });

    describe("Resource-Specific Permissions", () => {
        let studentClient: TestClient;
        let studentUserId: string;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "student",
                email: `student.test.${Date.now()}@example.com`,
            });
            studentClient = createTestClient(app, env, result.cookie);
            studentUserId = result.userId;
        });

        it("student should be able to list media (has media:read)", async () => {
            const res = await studentClient.orgs.media.list(ownerOrgId);
            expect(res.status).toBe(200);
        });

        it("student should NOT be able to delete media (lacks media:delete)", async () => {
            const res = await studentClient.orgs.media.delete(ownerOrgId, "some-media-id");
            expect(res.status).toBe(403);
        });

        it("student should be able to list schedule (has schedule:read)", async () => {
            const res = await studentClient.orgs.schedule.list(ownerOrgId);
            expect(res.status).toBe(200);
        });

        it("student should NOT be able to create session (lacks schedule:create)", async () => {
            const res = await studentClient.orgs.schedule.create(ownerOrgId, {} as any);
            expect(res.status).toBe(403);
        });

        it("user should be able to read their own profile (self-bypass)", async () => {
            const res = await studentClient.orgs.users.profile.get(studentUserId);
            expect(res.status).toBe(200);
        });

        it("user should NOT be able to read another user's profile", async () => {
            const res = await studentClient.orgs.users.profile.get("some-other-id");
            expect(res.status).toBe(403);
        });
    });
});
