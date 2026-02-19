import { describe, it, expect, beforeEach } from "vitest";
import app from "../../api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createAuthenticatedOrg, getAuthCookie, extractCookies } from "../lib/auth-test.helper";
import { createMemberRequest, parseJson, type ErrorResponse } from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";
import { drizzle } from "drizzle-orm/d1";
import { user as userTable } from "../../api/db/schema.db";
import { eq } from "drizzle-orm";

/**
 * Helper: create a super admin user (platform-level).
 * Signs up with known credentials, then sets `user.role = "admin"` in DB.
 * Re-authenticates via sign-in only (no sign-up) so the new session reflects the role change.
 */
async function createSuperAdmin(params: {
    app: typeof app;
    env: any;
    email?: string;
}) {
    const email = params.email ?? `superadmin.${Date.now()}@example.com`;
    const password = "Password123!";

    // Initial sign-up + sign-in
    await getAuthCookie({
        app: params.app,
        env: params.env,
        user: { email, password, name: "Super Admin" },
    });

    // Set user.role = "admin" directly in DB (better-auth admin plugin field)
    const db = drizzle(params.env.DB);
    await db
        .update(userTable)
        .set({ role: "admin" } as any)
        .where(eq(userTable.email, email));

    // Re-sign-in directly (NOT via getAuthCookie which calls sign-up again)
    const signInRes = await params.app.request("/api/v1/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
    }, params.env);

    if (!signInRes.ok) {
        throw new Error(`Super admin re-sign-in failed: ${signInRes.status}`);
    }

    return { cookie: extractCookies(signInRes), email };
}

describe("Super Admin Bypass Tests", () => {
    let ownerOrgId: string;
    let ownerCookie: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        ownerCookie = cookie;
        ownerOrgId = orgId;
    });

    describe("Super admin can bypass org membership", () => {
        it("super admin can create a member in an org they do NOT belong to", async () => {
            // Create a super admin who is NOT a member of the org
            const { cookie: superAdminCookie } = await createSuperAdmin({ app, env });

            const payload = createMockMemberCreationPayload();
            const res = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload,
                cookie: superAdminCookie,
            });

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.user.email).toBe(payload.email);
        });
    });

    describe("Super admin bypasses permission checks", () => {
        it("super admin can perform actions even without explicit permission", async () => {
            const { cookie: superAdminCookie } = await createSuperAdmin({ app, env });

            // Create two members — both should succeed for a super admin
            const payload1 = createMockMemberCreationPayload();
            const res1 = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload: payload1,
                cookie: superAdminCookie,
            });
            expect(res1.status).toBe(201);

            const payload2 = createMockMemberCreationPayload();
            const res2 = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload: payload2,
                cookie: superAdminCookie,
            });
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

            const payload = createMockMemberCreationPayload();
            const res = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload,
                cookie: regularCookie,
            });

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.success).toBe(false);
        });
    });
});
