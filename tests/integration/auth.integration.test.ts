import { env } from "cloudflare:test";
import app from "@api/app";
import * as schema from "@shared/db/schema";
import type { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

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
        const body = (await res.json()) as SignUpWithOrgResponseDTO;

        expect(body).toHaveProperty("user");
        expect(body.user).toHaveProperty("id");
        expect(body.user.email).toBe(payload.email);
        expect(body.user.role).toBe("owner");

        expect(body).toHaveProperty("organization");
        expect(body.organization.name).toBe(payload.organizationName);
    });

    it("POST /api/v1/auth/signup-with-org should return error for existing user", async () => {
        const payload = createMockSignUpWithOrgPayload();

        const setupRes = await client.auth.signUpWithOrg(payload);
        expect(setupRes.status).toBe(201);

        const res = await client.auth.signUpWithOrg(payload);

        expect(res.status).toBe(409);
        const body = (await res.json()) as { message: string };
        expect(body.message).toBe("User already exists");
    });

    it("POST /api/v1/auth/signup-with-org should return error for existing organization", async () => {
        const payload1 = createMockSignUpWithOrgPayload();
        const payload2 = createMockSignUpWithOrgPayload();

        const setupRes = await client.auth.signUpWithOrg(payload1);
        expect(setupRes.status).toBe(201);

        payload2.email = `other.${Date.now()}.${Math.random()}@example.com`;
        payload2.organizationName = payload1.organizationName;
        const res = await client.auth.signUpWithOrg(payload2);

        expect(res.status).toBe(409);
        const body = (await res.json()) as { message: string };
        expect(body.message).toBe("Organization name already taken");
    });

    it("POST /api/v1/auth/signup-with-org should rollback user and organization atomically on setup failure", async () => {
        const payload = createMockSignUpWithOrgPayload();

        await db.insert(schema.authUsers).values({
            id: "dummy-user",
            name: "Dummy",
            email: "dummy@example.com",
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: "user",
            banned: false,
        });

        await db.insert(schema.authOrganizations).values({
            id: "dummy-org",
            name: "Dummy Org",
            slug: "dummy-org",
            createdAt: new Date(),
        });

        await db.insert(schema.authMembers).values({
            id: "pre-existing-conflict",
            organizationId: "dummy-org",
            userId: "dummy-user",
            role: "member",
            createdAt: new Date(),
        });

        const { MemberRepository } = await import("@api/repositories/member.repository");
        const { vi } = await import("vitest");
        const spy = vi.spyOn(MemberRepository.prototype, "prepareAdd").mockImplementation(function (
            this: any
        ) {
            return this.db.insert(schema.authMembers).values({
                id: "pre-existing-conflict", // Will conflict
                organizationId: "dummy-org", // Must match foreign key
                userId: "dummy-user", // Must match foreign key
                role: "owner",
                createdAt: new Date(),
            });
        });

        const res = await client.auth.signUpWithOrg(payload);

        expect(res.status).toBe(500);
        const body = (await res.json()) as { message: string };
        expect(body.message).toBe("Failed to setup organization, please try again");

        const user = await db.query.authUsers.findFirst({
            where: eq(schema.authUsers.email, payload.email),
        });
        expect(user).toBeUndefined();

        const slug = payload.organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const org = await db.query.authOrganizations.findFirst({
            where: eq(schema.authOrganizations.slug, slug),
        });
        expect(org).toBeUndefined();

        spy.mockRestore();
    });
    it("POST /api/v1/auth/sign-in/email should successfully authenticate user and create session", async () => {
        const payload = createMockSignUpWithOrgPayload();

        await client.auth.signUpWithOrg(payload);

        const signInPayload = {
            email: payload.email,
            password: payload.password,
        };

        const req = new Request("http://localhost/api/v1/auth/sign-in/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(signInPayload),
        });

        const res = await app.request(req, {}, env);

        expect(res.status).toBe(200);

        const body = (await res.json()) as any;
        expect(body).toHaveProperty("user");
        expect(body).toHaveProperty("token");
        expect(body.user.email).toBe(payload.email);
    });

    it("GET /api/v1/auth/organization/get-full-organization should return 200", async () => {
        const { cookie, orgId, orgData } = await createAuthenticatedOrg({ app, env });

        const req = new Request(
            `http://localhost/api/v1/auth/organization/get-full-organization?organizationId=${orgId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookie,
                },
            }
        );

        const res = await app.request(req, {}, env);

        expect(res.status).not.toBe(500);
        expect(res.status).toBe(200);

        const fullOrgBody = (await res.json()) as any;
        expect(fullOrgBody).toHaveProperty("id");
        expect(fullOrgBody.name).toBe(orgData.organization.name);
    });
});
