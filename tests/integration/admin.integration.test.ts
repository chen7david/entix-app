import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createAuthenticatedOrg, getAuthCookie, createSuperAdmin } from "../lib/auth-test.helper";
import { parseJson, type ErrorResponse } from "../lib/api-request.helper";
import { organization } from "@api/db/schema.db";
import { createTestClient } from "../lib/test-client";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const organizationSchema = createSelectSchema(organization, {
    createdAt: z.coerce.date(), // JSON payloads serialize Dates to strings
});

describe("Admin Route Integration Tests", () => {
    let standardOrgId: string;

    beforeEach(async () => {
        await createTestDb();
        // Create an initial organization to ensure the DB has data
        const { orgId } = await createAuthenticatedOrg({ app, env });
        standardOrgId = orgId;
    });

    describe("GET /api/v1/admin/organizations", () => {
        it("allows super admin to fetch all organizations", async () => {
            const { cookie } = await createSuperAdmin({ app, env });
            const superAdminClient = createTestClient(app, env, cookie);

            const res = await superAdminClient.admin.organizations.list();

            expect(res.status).toBe(200);
            const body = await parseJson<{ organizations: any[] }>(res);
            expect(body.organizations).toBeDefined();
            expect(Array.isArray(body.organizations)).toBe(true);
            expect(body.organizations.length).toBeGreaterThanOrEqual(1);

            // Assert shape via Drizzle-Zod
            const firstOrg = body.organizations[0];
            const parseResult = organizationSchema.safeParse(firstOrg);
            expect(parseResult.success).toBe(true);

            // Should contain the standard org we created in beforeEach
            const found = body.organizations.find(o => o.id === standardOrgId);
            expect(found).toBeDefined();
        });

        it("denies access to standard users with 403 Forbidden", async () => {
            // Create a regular user
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
            const res = await regularClient.admin.organizations.list();

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.error).toBe("Requires super admin privileges");
        });

        it("denies access to unauthenticated requests with 401 Unauthorized", async () => {
            const unauthClient = createTestClient(app, env); // No cookie
            const res = await unauthClient.admin.organizations.list();

            expect(res.status).toBe(401);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.success).toBe(false);
            expect((body as any).message || body.error).toBeDefined();
        });
    });
});
