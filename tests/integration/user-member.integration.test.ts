import { env } from "cloudflare:test";
import app from "@api/app";
import * as schema from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockUserDbRecord } from "../factories/auth.factory";
import { createMockMemberCreationPayload } from "../factories/member-creation.factory";
import { createAuthenticatedOrg } from "../lib/auth-test.helper";
import { createTestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

describe("AuthUser & AuthMember Creation Atomicity", () => {
    let db: ReturnType<typeof createTestDb> extends Promise<infer U> ? U : never;

    beforeEach(async () => {
        db = await createTestDb();
    });

    it("POST /api/v1/orgs/:orgId/members should rollback user creation atomically on setup failure", async () => {
        const { orgId, cookie } = await createAuthenticatedOrg({ app, env });

        const fakeConflictUser = createMockUserDbRecord({ id: "fake-conflict-user" });
        await db.insert(schema.authUsers).values(fakeConflictUser);

        await db.insert(schema.authMembers).values({
            id: "pre-existing-conflict",
            organizationId: orgId,
            userId: fakeConflictUser.id, // Avoid triggering constraint here but satisfy FK
            role: "member",
            createdAt: new Date(),
        });

        const targetEmail = "new-member@example.com";
        const dummyName = "New AuthMember";

        const { MemberRepository } = await import("@api/repositories/member.repository");
        const spy = vi
            .spyOn(MemberRepository.prototype, "prepareInsertQuery")
            .mockImplementation(
                (_id: string, organizationId: string, userId: string, role: string) => {
                    return db.insert(schema.authMembers).values({
                        id: "pre-existing-conflict", // Will conflict with existing member ID
                        organizationId,
                        userId,
                        role,
                        createdAt: new Date(),
                    });
                }
            );

        const payload = createMockMemberCreationPayload({ email: targetEmail, name: dummyName });
        const realClient = createTestClient(app, env, cookie);

        const res = await realClient.orgs.members.create(orgId, payload);

        expect(res.status).toBe(500);

        const user = await db.query.authUsers.findFirst({
            where: eq(schema.authUsers.email, targetEmail),
        });
        expect(user).toBeUndefined();

        spy.mockRestore();
    });
});
