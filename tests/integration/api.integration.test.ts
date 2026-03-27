import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "../lib/utils";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import type { UserDTO } from "@shared/schemas/dto/user.dto";
import { parseJson, type ErrorResponse } from "../lib/api-request.helper";

describe("API Integration Test", () => {
    let client: ReturnType<typeof createTestClient>;
    let orgId: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        client = createTestClient(app, env, cookie);
        orgId = id;
    });

    it("GET /api/v1/unknown should return 404 JSON", async () => {
        const res = await app.request("/api/v1/unknown-route", {}, env);
        expect(res.status).toBe(404);
        const body = await parseJson<ErrorResponse>(res);
        expect(body.success).toBe(false);
        expect(body.message).toBe("Route /api/v1/unknown-route not found");
    });

    it("GET /api/v1/orgs/:orgId/users should return list of users in organization", async () => {
        const res = await client.orgs.users.list(orgId);

        expect(res.status).toBe(200);

        const body = await parseJson<{ items: UserDTO[]; nextCursor: string | null }>(res);

        expect(body.items).toBeInstanceOf(Array);
        expect(body.items.length).toBeGreaterThanOrEqual(1);
        expect(body.items[0]).toHaveProperty("id");
    });

    it("GET /api/v1/orgs/:orgId/users should allow super admin access", async () => {
        const { createSuperAdmin } = await import("../lib/auth-test.helper");
        const { cookie } = await createSuperAdmin({ app, env });
        const superAdminClient = createTestClient(app, env, cookie);

        const res = await superAdminClient.orgs.users.list(orgId);
        expect(res.status).toBe(200);
        const body = await parseJson<{ items: UserDTO[]; nextCursor: string | null }>(res);
        expect(body.items).toBeInstanceOf(Array);
    });
});
