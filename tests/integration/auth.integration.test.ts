import { describe, it, expect, beforeEach } from "vitest";
import app from "../../api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockSignUpWithOrgPayload } from "../factories/auth.factory";
import { SignUpWithOrgResponseDTO } from "@shared/schemas/dto/auth.dto";

describe("Auth Integration Test", () => {

    beforeEach(async () => {
        await createTestDb();
    });

    it("POST /api/v1/auth/signup-with-org should create user and organization", async () => {
        const payload = createMockSignUpWithOrgPayload();

        const res = await app.request("/api/v1/auth/signup-with-org", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }, env);

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
        const setupRes = await app.request("/api/v1/auth/signup-with-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);
        expect(setupRes.status).toBe(200);

        // Second request with same user
        const res = await app.request("/api/v1/auth/signup-with-org", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }, env);

        expect(res.status).toBe(400);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("User already exists");
    });

    it("POST /api/v1/auth/signup-with-org should return error for existing organization name", async () => {
        const payload = createMockSignUpWithOrgPayload();

        // First request to create org
        const setupRes = await app.request("/api/v1/auth/signup-with-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }, env);
        expect(setupRes.status).toBe(200);

        const newPayload = createMockSignUpWithOrgPayload({
            organizationName: payload.organizationName
        });
        // We need a different email to bypass the user check, but same org name
        // The factory generates random emails, so we just override the org name to match the first one.

        const res = await app.request("/api/v1/auth/signup-with-org", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newPayload),
        }, env);

        expect(res.status).toBe(400);
        const body = await res.json() as { message: string };
        expect(body.message).toBe("Organization name already taken");
    });
});
