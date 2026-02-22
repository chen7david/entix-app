import { describe, it, expect, beforeEach } from "vitest";
import app from "@api/app";
import { env } from "cloudflare:test";
import { createTestDb } from "../lib/utils";
import { createTestClient } from "../lib/test-client";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createMockUserDbRecord } from "../factories/auth.factory";
import * as schema from "@api/db/schema.db";
import { eq } from "drizzle-orm";

describe("User & Member Creation Atomicity", () => {
    let db: ReturnType<typeof createTestDb> extends Promise<infer U> ? U : never;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("POST /api/v1/orgs/:orgId/members should rollback user creation atomically on setup failure", async () => {
        // Use the proper test helper to get a real valid database session
        const { orgId, cookie } = await createAuthenticatedOrg({ app, env });

        const fakeConflictUser = createMockUserDbRecord({ id: "fake-conflict-user" });
        await db.insert(schema.user).values(fakeConflictUser);

        // Seed a member explicitly to trigger a UNIQUE constraint violation later
        await db.insert(schema.member).values({
            id: "pre-existing-conflict",
            organizationId: orgId,
            userId: fakeConflictUser.id, // Avoid triggering constraint here but satisfy FK
            role: "member",
            createdAt: new Date(),
        });

        const targetEmail = "new-member@example.com";
        const dummyName = "New Member";

        // Mock the member repository `prepareAdd` to intentionally insert a conflicting 'id'
        const { MemberRepository } = await import("@api/repositories/member.repository");
        const { vi } = await import("vitest");
        const spy = vi.spyOn(MemberRepository.prototype, 'prepareAdd').mockImplementation(function (this: any) {
            const getDbClient = require("@api/factories/db.factory").getDbClient;
            return getDbClient((this as any).ctx).insert(schema.member).values({
                id: "pre-existing-conflict", // Will conflict with existing member ID
                organizationId: orgId, // Must match foreign key
                userId: "will-not-save", // Assume uId
                role: "member",
                createdAt: new Date(),
            });
        });

        const payload = createMockMemberCreationPayload({ email: targetEmail, name: dummyName });
        const realClient = createTestClient(app, env, cookie);

        const res = await realClient.orgs.members.create(orgId, payload);

        // Ensure the handler caught the Drizzle batch error
        expect(res.status).toBe(500);

        // Verify the user was NOT created (rolled back atomically)
        const user = await db.query.user.findFirst({
            where: eq(schema.user.email, targetEmail)
        });
        expect(user).toBeUndefined();

        spy.mockRestore();
    });
});
