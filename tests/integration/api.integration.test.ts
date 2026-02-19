import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../lib/utils";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";

describe("API Integration Test", () => {
    let client: ReturnType<typeof createTestClient>;
    let orgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("GET /api/v1/orgs/:orgId/users should return list of users in organization", async () => {
        const res = await client.orgs.users.list(orgId);

        expect(res.status).toBe(200);

        const body: any[] = await res.json();

        expect(body).toBeInstanceOf(Array);
        // At least the owner user should be present
        expect(body.length).toBeGreaterThanOrEqual(1);
        expect(body[0]).toHaveProperty("id");
        expect(body[0]).toHaveProperty("email");
        expect(body[0]).toHaveProperty("name");
    });

    it("GET /api/v1/unknown should return 404 JSON", async () => {
        const res = await app.request("/api/v1/unknown-route", {}, env);
        expect(res.status).toBe(404);
        const body: { message?: string, error?: string } = await res.json();
    });
});
