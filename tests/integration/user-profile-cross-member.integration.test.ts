import { env } from "cloudflare:test";
import app from "@api/app";
import { beforeEach, describe, expect, it } from "vitest";
import { createAuthenticatedOrg, createOrgMemberWithRole } from "../lib/auth-test.helper";
import { createTestClient, type TestClient } from "../lib/test-client";
import { createTestDb } from "../lib/utils";

/**
 * Co-members must not inherit peer student/teacher profile permissions.
 * Only self or elevated admin/owner roles may read/update another user's profile.
 */
describe("User profile cross-member isolation", () => {
    let orgId: string;
    let studentAClient: TestClient;
    let studentAId: string;
    let studentBId: string;
    let adminClient: TestClient;

    beforeEach(async () => {
        await createTestDb();
        const { cookie, orgId: id } = await createAuthenticatedOrg({ app, env });
        orgId = id;
        // Owner cookie unused; create elevated admin for positive control
        const stamp = Date.now();
        const admin = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "admin",
            email: `admin.profile.${stamp}@example.com`,
        });
        adminClient = createTestClient(app, env, admin.cookie);

        const studentA = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: `studenta.profile.${stamp}@example.com`,
        });
        studentAClient = createTestClient(app, env, studentA.cookie);
        studentAId = studentA.userId;

        const studentB = await createOrgMemberWithRole({
            app,
            env,
            orgId,
            role: "student",
            email: `studentb.profile.${stamp}@example.com`,
        });
        studentBId = studentB.userId;
    });

    it("student can read their own profile", async () => {
        const res = await studentAClient.orgs.users.profile.get(studentAId);
        expect(res.status).toBe(200);
    });

    it("student cannot read a co-member student profile", async () => {
        const res = await studentAClient.orgs.users.profile.get(studentBId);
        expect(res.status).toBe(403);
    });

    it("student cannot update a co-member student profile", async () => {
        const res = await studentAClient.request(`/api/v1/users/${studentBId}/profile`, {
            method: "PUT",
            body: {
                firstName: "Hacked",
                lastName: "User",
                displayName: "Hacked",
                sex: "other",
                birthDate: null,
            },
        });
        expect(res.status).toBe(403);
    });

    it("org admin can read a student profile in the same org", async () => {
        const res = await adminClient.orgs.users.profile.get(studentBId);
        expect(res.status).toBe(200);
    });
});
