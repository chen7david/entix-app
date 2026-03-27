import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createSuperAdmin, getAuthCookie } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { parseJson } from "../lib/api-request.helper";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { nanoid } from "nanoid";

describe("Admin Organizations Integration", () => {
    beforeEach(async () => {
        await createTestDb();
    });

    describe("Authentication and Authorization", () => {
        it("returns 401 Unauthorized if no session cookie", async () => {
            const client = createTestClient(app, env);
            const res = await client.request("/api/v1/admin/organizations");
            expect(res.status).toBe(401);
        });

        it("returns 403 Forbidden for a regular user (not super admin)", async () => {
            const regularCookie = await getAuthCookie({
                app,
                env,
                user: {
                    email: `regular.${Date.now()}@example.com`,
                    password: "Password123!",
                    name: "Regular User",
                },
            });
            const client = createTestClient(app, env, regularCookie);
            const res = await client.request("/api/v1/admin/organizations");
            expect(res.status).toBe(403);
        });
    });

    describe("Super Admin Access", () => {
        it("returns 200 OK and lists all organizations for super admin", async () => {
            const ctxMock: any = { env };
            const { getDbClient } = await import("@api/factories/db.factory");
            const db = getDbClient(ctxMock);
            const repo = new OrganizationRepository(db);

            await repo.prepareCreate(nanoid(), "Test Org 1", "test-org-1").execute();
            await repo.prepareCreate(nanoid(), "Test Org 2", "test-org-2").execute();

            const { cookie } = await createSuperAdmin({ app, env });
            const client = createTestClient(app, env, cookie);

            const res = await client.request("/api/v1/admin/organizations");

            expect(res.status).toBe(200);
            const body = await parseJson<any[]>(res);

            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThanOrEqual(2);
            expect(body.some(org => org.slug === "test-org-1")).toBe(true);
            expect(body.some(org => org.slug === "test-org-2")).toBe(true);

            const firstOrg = body[0];
            expect(typeof firstOrg.id).toBe('string');
            expect(typeof firstOrg.name).toBe('string');
            expect(typeof firstOrg.createdAt).toBe('number');
        });
    });
});
