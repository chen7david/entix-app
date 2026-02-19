import { describe, it, expect, beforeEach } from "vitest";
import app from "../../api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createAuthenticatedOrg, getAuthCookie } from "../lib/auth-test.helper";
import {
    createMemberRequest,
    authenticatedGet,
    parseJson,
    type ErrorResponse,
} from "../lib/api-request.helper";
import type { CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";
import { drizzle } from "drizzle-orm/d1";
import { user as userTable, member as memberTable } from "../../api/db/schema.db";
import { eq } from "drizzle-orm";
import { createMockMember } from "../factories/member.factory";

/**
 * Helper: create a user with known credentials, add them to an org with a
 * specific role via direct DB insert, and return their session cookie.
 */
async function createOrgMemberWithRole(params: {
    app: typeof app;
    env: any;
    orgId: string;
    role: "owner" | "admin" | "member";
    email: string;
}) {
    const { app: testApp, env: testEnv, orgId, role, email } = params;

    // 1. Sign up + sign in with known password
    const cookie = await getAuthCookie({
        app: testApp,
        env: testEnv,
        user: { email, password: "Password123!", name: `Test ${role}` },
    });

    // 2. Look up user ID from DB
    const db = drizzle(testEnv.DB);
    const [dbUser] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email));

    if (!dbUser) throw new Error(`User ${email} not found in DB after sign-up`);

    // 3. Insert membership directly
    const mockMember = createMockMember({
        organizationId: orgId,
        userId: dbUser.id,
        role,
    });
    await db.insert(memberTable).values(mockMember);

    return { cookie, userId: dbUser.id };
}

describe("Permission-Based Authorization Tests", () => {
    let ownerOrgId: string;
    let ownerCookie: string;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId } = await createAuthenticatedOrg({ app, env });
        ownerCookie = cookie;
        ownerOrgId = orgId;
    });

    describe("Owner permissions", () => {
        it("owner should be able to create a member (has member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload,
                cookie: ownerCookie,
            });

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.user.email).toBe(payload.email);
        });
    });

    describe("Admin permissions", () => {
        let adminCookie: string;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "admin",
                email: `admin.${Date.now()}@example.com`,
            });
            adminCookie = result.cookie;
        });

        it("admin should be able to create a member (has member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload,
                cookie: adminCookie,
            });

            expect(res.status).toBe(201);
            const body = await parseJson<CreateMemberResponseDTO>(res);
            expect(body.user.email).toBe(payload.email);
        });
    });

    describe("Member permissions", () => {
        let memberCookie: string;

        beforeEach(async () => {
            const result = await createOrgMemberWithRole({
                app,
                env,
                orgId: ownerOrgId,
                role: "member",
                email: `member.${Date.now()}@example.com`,
            });
            memberCookie = result.cookie;
        });

        it("regular member should NOT be able to create a member (lacks member:create)", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload,
                cookie: memberCookie,
            });

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            expect(body.success).toBe(false);
        });

        it("should return a meaningful permission error message", async () => {
            const payload = createMockMemberCreationPayload();
            const res = await createMemberRequest({
                app,
                env,
                organizationId: ownerOrgId,
                payload,
                cookie: memberCookie,
            });

            expect(res.status).toBe(403);
            const body = await parseJson<ErrorResponse>(res);
            // Error comes from better-auth access control or our middleware
            expect(body.message).toBeDefined();
        });
    });
});
