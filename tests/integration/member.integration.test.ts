import { env } from "cloudflare:test";
import app from "@api/app";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { type ErrorResponse, parseJson } from "../lib/api-request.helper";
import { createAuthenticatedOrg, getAuthCookie } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

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
        const body = (await res.json()) as CreateMemberResponseDTO;

        expect(body.user.email).toBe(payload.email);
        expect(body.member.role).toBe(payload.role);
    });

    it("should fail when user with email already exists", async () => {
        const payload = createMockMemberCreationPayload();

        await client.orgs.members.create(orgId, payload);

        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(409);
    });

    it("should fail when organization does not exist", async () => {
        const payload = createMockMemberCreationPayload();
        const res = await client.orgs.members.create("fake-id", payload);

        expect(res.status).toBe(403);
    });

    it("should create member with different role", async () => {
        const payload = createMockMemberCreationPayload({ role: "admin" });
        const res = await client.orgs.members.create(orgId, payload);

        expect(res.status).toBe(201);
        const body = (await res.json()) as CreateMemberResponseDTO;
        expect(body.member.role).toBe("admin");
    });

    it("should fail when user lacks permission (unauthorized member)", async () => {
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
        expect(body.message).toContain("You are not a member of organization");
    });
});
