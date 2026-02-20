import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { parseJson, type ErrorResponse } from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";

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
            expect(body.user.email).toBe(payload.email);
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
            expect(body.user.email).toBe(payload.email);
        });
    });

    describe("Member permissions", () => {
        let memberClient: TestClient;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "member",
                email: `member.${Date.now()}@example.com`,
            });
            memberClient = createTestClient(app, env, result.cookie);
        });

        it("regular member should NOT be able to create a member (lacks member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await memberClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.success).toBe(false);
        });

        it("should return a meaningful permission error message", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await memberClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            // Error comes from better-auth access control or our middleware
            expect(body.message).toBeDefined();
        });
    });
});
