import { describe, it, expect, beforeEach } from "vitest";
import app from "../../api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import { signUpWithOrgRequest } from "../lib/api-request.helper";
import { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";

describe("Auth Integration Test", () => {

    beforeEach(async () => {
        await createTestDb();
    });

    it("POST /api/v1/auth/signup-with-org should create user and organization", async () => {
        const payload = createMockSignUpWithOrgPayload();
        const res = await signUpWithOrgRequest(app, env, payload);

        expect(res.status).toBe(200);
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
        const setupRes = await signUpWithOrgRequest(app, env, payload);
        expect(setupRes.status).toBe(200);

        // Second request with same user
        const res = await signUpWithOrgRequest(app, env, payload);

        expect(res.status).toBe(400);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("User already exists");
    });

    it("POST /api/v1/auth/signup-with-org should return error for existing organization", async () => {
        const payload1 = createMockSignUpWithOrgPayload();
        const payload2 = createMockSignUpWithOrgPayload();

        // Use same org name for both payloads
        payload2.organizationName = payload1.organizationName;

        // First request to create organization
        const setupRes = await signUpWithOrgRequest(app, env, payload1);
        expect(setupRes.status).toBe(200);

        // Second request with same organization name
        const res = await signUpWithOrgRequest(app, env, payload2);

        expect(res.status).toBe(400);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("Organization name already taken");
    });
});
