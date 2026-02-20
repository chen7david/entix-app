import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createAuthenticatedOrg, getAuthCookie, createSuperAdmin } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { parseJson, type ErrorResponse } from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";

describe("Super Admin Bypass Tests", () => {
    let ownerOrgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { orgId } = await createAuthenticatedOrg({ app, env });
        ownerOrgId = orgId;
    });

    describe("Super admin can bypass org membership", () => {
        it("super admin can create a member in an org they do NOT belong to", async () => {
            const { cookie } = await createSuperAdmin({ app, env });
            const superAdminClient = createTestClient(app, env, cookie);

            const payload = createMockMemberCreationPayload();
            const res = await superAdminClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.user.email).toBe(payload.email);
        });
    });

    describe("Super admin bypasses permission checks", () => {
        it("super admin can perform actions even without explicit permission", async () => {
            const { cookie } = await createSuperAdmin({ app, env });
            const superAdminClient = createTestClient(app, env, cookie);

            // Create two members — both should succeed for a super admin
            const payload1 = createMockMemberCreationPayload();
            const res1 = await superAdminClient.orgs.members.create(ownerOrgId, payload1);
            expect(res1.status).toBe(201);

            const payload2 = createMockMemberCreationPayload();
            const res2 = await superAdminClient.orgs.members.create(ownerOrgId, payload2);
            expect(res2.status).toBe(201);
        });
    });

    describe("Regular user still blocked", () => {
        it("non-super-admin user cannot bypass membership check", async () => {
            // Create a regular user (NOT super admin, NOT org member)
            const regularCookie = await getAuthCookie({
                app,
                env,
                user: {
                    email: `regular.${Date.now()}@example.com`,
                    password: "Password123!",
                    name: "Regular User",
                },
            });

            const regularClient = createTestClient(app, env, regularCookie);
            const payload = createMockMemberCreationPayload();
            const res = await regularClient.orgs.members.create(ownerOrgId, payload);

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.success).toBe(false);
        });
    });
});
